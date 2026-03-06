from pypdf import PdfReader
from pathlib import Path

RAW_DIR = Path("../raw")
OUT_DIR = Path("../processed")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def extract_pdf(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    text_parts = []
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        page_text = page_text.strip()
        if page_text:
            text_parts.append(f"\n\n--- Page {i+1} ---\n\n{page_text}")
    return "".join(text_parts)

def main():
    modules = [p for p in RAW_DIR.iterdir() if p.is_dir()]
    if not modules:
        print("❌ No module folders found inside raw/")
        return

    for mod in modules:
        out_mod = OUT_DIR / mod.name
        out_mod.mkdir(parents=True, exist_ok=True)

        pdfs = list(mod.glob("*.pdf"))
        print(f"\n📁 Module: {mod.name} | PDFs: {len(pdfs)}")

        for pdf in pdfs:
            out_txt = out_mod / (pdf.stem + ".txt")

            # skip if already extracted
            if out_txt.exists():
                continue

            try:
                text = extract_pdf(pdf)
                out_txt.write_text(text, encoding="utf-8")
                print(f"✅ Extracted: {pdf.name} -> {out_txt.name}")
            except Exception as e:
                print(f"❌ Failed: {pdf.name} | {e}")

    print("\n✅ PDF extraction complete.")

if __name__ == "__main__":
    main()