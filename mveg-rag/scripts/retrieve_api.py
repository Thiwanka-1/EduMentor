from flask import Flask, request, jsonify
from pathlib import Path
import faiss
import json
import numpy as np
from sentence_transformers import SentenceTransformer

app = Flask(__name__)

INDEX_DIR = Path("./index")
MODEL_NAME = "BAAI/bge-small-en-v1.5"

model = SentenceTransformer(MODEL_NAME)

# Cache indexes in memory for speed
INDEX_CACHE = {}   # module -> faiss index
META_CACHE = {}    # module -> metadata list

def load_module(module: str):
    module = module.strip()
    if module in INDEX_CACHE:
        return INDEX_CACHE[module], META_CACHE[module]

    mod_dir = INDEX_DIR / module
    idx_path = mod_dir / "faiss.index"
    meta_path = mod_dir / "metadata.json"

    if not idx_path.exists() or not meta_path.exists():
        return None, None

    index = faiss.read_index(str(idx_path))
    metadata = json.loads(meta_path.read_text(encoding="utf-8"))

    INDEX_CACHE[module] = index
    META_CACHE[module] = metadata
    return index, metadata

@app.route("/retrieve", methods=["POST"])
def retrieve():
    data = request.json or {}
    query = data.get("query", "").strip()
    top_k = int(data.get("top_k", 5))
    module = (data.get("module", "ALL") or "ALL").strip()

    if not query:
        return jsonify({"error": "query required"}), 400

    # If module=ALL => search across all modules (slower)
    modules = []
    if module.upper() == "ALL":
        modules = [p.name for p in INDEX_DIR.iterdir() if p.is_dir()]
    else:
        modules = [module]

    q_emb = model.encode([query], normalize_embeddings=True)
    q_emb = np.array(q_emb, dtype=np.float32)

    all_results = []

    for mod in modules:
        index, metadata = load_module(mod)
        if index is None:
            continue

        D, I = index.search(q_emb, top_k)

        for score, idx in zip(D[0], I[0]):
            if idx < 0:
                continue
            chunk = metadata[idx]
            all_results.append({
                "module": chunk.get("module", mod),
                "source": chunk.get("source"),
                "page": chunk.get("page"),
                "chunk_id": chunk.get("chunk_id"),
                "text": chunk.get("text"),
                "score": float(score),
            })

    # sort across modules by score
    all_results.sort(key=lambda x: x["score"], reverse=True)

    # return best top_k overall
    return jsonify(all_results[:top_k])

if __name__ == "__main__":
    app.run(port=8001)