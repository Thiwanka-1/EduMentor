from pathlib import Path
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

CHUNKS_DIR = Path("../chunks")
INDEX_DIR = Path("../index")
MODEL_NAME = "BAAI/bge-small-en-v1.5"

def load_all_chunks(module_dir: Path):
    all_chunks = []
    for f in module_dir.glob("*.chunks.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        if isinstance(data, list):
            all_chunks.extend(data)
    return all_chunks

def main():
    INDEX_DIR.mkdir(parents=True, exist_ok=True)

    model = SentenceTransformer(MODEL_NAME)
    print(f"✅ Loaded embedding model: {MODEL_NAME}")

    modules = [p for p in CHUNKS_DIR.iterdir() if p.is_dir()]
    if not modules:
        print("❌ No module chunk folders found inside chunks/")
        return

    for mod in modules:
        chunks = load_all_chunks(mod)
        if not chunks:
            print(f"⚠️ No chunks in module: {mod.name}")
            continue

        texts = [c["text"] for c in chunks]
        print(f"\n📁 Building index for module: {mod.name}")
        print(f"   Chunks: {len(texts)}")

        embeddings = model.encode(
            texts,
            normalize_embeddings=True,
            batch_size=64,
            show_progress_bar=True
        )

        embeddings = np.array(embeddings, dtype=np.float32)
        dim = embeddings.shape[1]

        # Simple, accurate index
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings)

        out_mod = INDEX_DIR / mod.name
        out_mod.mkdir(parents=True, exist_ok=True)

        faiss.write_index(index, str(out_mod / "faiss.index"))
        (out_mod / "metadata.json").write_text(json.dumps(chunks, indent=2), encoding="utf-8")

        print(f"✅ Saved: index/{mod.name}/faiss.index + metadata.json")

    print("\n✅ All module indexes built.")

if __name__ == "__main__":
    main()