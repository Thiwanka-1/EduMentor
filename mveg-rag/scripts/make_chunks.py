from pathlib import Path
import json
import re

PROCESSED_DIR = Path("../processed")
CHUNKS_DIR = Path("../chunks")

CHUNK_WORDS = 300
OVERLAP_WORDS = 60

def split_words(text: str):
    return re.findall(r"\S+", text)

def chunk_words(words, size, overlap):
    chunks = []
    start = 0
    i = 0
    while start < len(words):
        end = start + size
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append((i, chunk))
            i += 1
        start += (size - overlap)
    return chunks

def extract_page_hint(chunk_text: str):
    # tries to find the latest "--- Page X ---" marker in the chunk
    m = re.findall(r"--- Page (\d+) ---", chunk_text)
    return int(m[-1]) if m else None

def main():
    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)

    modules = [p for p in PROCESSED_DIR.iterdir() if p.is_dir()]
    if not modules:
        print("❌ No module folders found inside processed/")
        return

    for mod in modules:
        out_mod = CHUNKS_DIR / mod.name
        out_mod.mkdir(parents=True, exist_ok=True)

        txt_files = list(mod.glob("*.txt"))
        print(f"\n📁 Module: {mod.name} | TXT files: {len(txt_files)}")

        for txt in txt_files:
            text = txt.read_text(encoding="utf-8", errors="ignore")
            words = split_words(text)

            chunk_list = []
            chunks = chunk_words(words, CHUNK_WORDS, OVERLAP_WORDS)

            for idx, ctext in chunks:
                page = extract_page_hint(ctext)
                chunk_list.append({
                    "module": mod.name,
                    "source": txt.name,
                    "chunk_id": f"{txt.stem}_chunk_{idx}",
                    "page": page,
                    "text": ctext,
                })

            out_json = out_mod / f"{txt.stem}.chunks.json"
            out_json.write_text(json.dumps(chunk_list, indent=2), encoding="utf-8")
            print(f"✅ Chunks: {txt.name} -> {out_json.name} ({len(chunk_list)})")

    print("\n✅ Chunking complete.")

if __name__ == "__main__":
    main()