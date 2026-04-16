from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_DIR = "models/domain_classifier"

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()

label_map = {0: "out_of_scope", 1: "in_scope"}

def predict(text: str):
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
        pred = torch.argmax(probs).item()

    return {
        "label": label_map[pred],
        "confidence": float(probs[pred]),
        "in_scope_confidence": float(probs[1]),
        "out_of_scope_confidence": float(probs[0]),
    }

tests = [
   "what is SLIIT"
]

for t in tests:
    print("\nQuery:", t)
    print(predict(t))