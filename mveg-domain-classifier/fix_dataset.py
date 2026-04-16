import pandas as pd
import csv

INPUT_FILE = "data/domain_dataset.csv"
OUTPUT_FILE = "data/domain_dataset_fixed.csv"

rows = []

with open(INPUT_FILE, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

# keep header
header = lines[0].strip()
rows.append(["text", "label"])

for i, line in enumerate(lines[1:], start=2):
    line = line.strip()
    if not line:
        continue

    # split only on the last comma
    if "," not in line:
        print(f"Skipping bad line {i}: {line}")
        continue

    text, label = line.rsplit(",", 1)
    text = text.strip().strip('"')
    label = label.strip()

    if label not in {"in_scope", "out_of_scope"}:
        print(f"Skipping bad label line {i}: {line}")
        continue

    rows.append([text, label])

with open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerows(rows)

print(f"✅ Fixed dataset saved to {OUTPUT_FILE}")