from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_DIR = "models/domain_classifier"
THRESHOLD = 0.80

app = Flask(__name__)

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()

@app.route("/classify", methods=["POST"])
def classify():
    data = request.json or {}
    text = data.get("text", "").strip()

    if not text:
      return jsonify({"error": "text required"}), 400

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128,
    )

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)[0]

    in_scope_conf = float(probs[1])
    out_scope_conf = float(probs[0])

    final_label = "in_scope" if in_scope_conf >= THRESHOLD else "out_of_scope"

    return jsonify({
        "label": final_label,
        "in_scope_confidence": in_scope_conf,
        "out_of_scope_confidence": out_scope_conf,
        "threshold": THRESHOLD,
    })

if __name__ == "__main__":
    app.run(port=8002)