import pandas as pd
import numpy as np
from datasets import Dataset
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    DataCollatorWithPadding,
)

MODEL_NAME = "distilbert-base-uncased"
DATA_PATH = "data/domain_dataset_fixed.csv"
OUTPUT_DIR = "models/domain_classifier"

# 1. Load data
df = pd.read_csv(DATA_PATH)

label_map = {"out_of_scope": 0, "in_scope": 1}
df["label"] = df["label"].map(label_map)

df = df.dropna(subset=["text", "label"]).reset_index(drop=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print("Dataset size:", len(df))
print(df.head())

# 2. Split
train_size = int(0.8 * len(df))
train_df = df[:train_size]
val_df = df[train_size:]

train_dataset = Dataset.from_pandas(train_df[["text", "label"]], preserve_index=False)
val_dataset = Dataset.from_pandas(val_df[["text", "label"]], preserve_index=False)

# 3. Tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def tokenize(batch):
    return tokenizer(batch["text"], truncation=True, max_length=128)

train_dataset = train_dataset.map(tokenize, batched=True)
val_dataset = val_dataset.map(tokenize, batched=True)

train_dataset = train_dataset.remove_columns(["text"])
val_dataset = val_dataset.remove_columns(["text"])

train_dataset.set_format("torch")
val_dataset.set_format("torch")

data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

# 4. Model
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=2
)

# 5. Metrics
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)

    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, preds, average="binary", zero_division=0
    )
    acc = accuracy_score(labels, preds)

    return {
        "accuracy": acc,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }

# 6. Training args (compatibility-safe)
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    do_train=True,
    do_eval=True,
    learning_rate=2e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=5,
    weight_decay=0.01,
    logging_steps=1,
    save_steps=50,
    report_to=[],
)

# 7. Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    data_collator=data_collator,
    compute_metrics=compute_metrics,
)

# 8. Train
trainer.train()

# 9. Evaluate
metrics = trainer.evaluate()
print("\nValidation metrics:", metrics)

# 10. Save
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print(f"\n✅ Training complete. Model saved to: {OUTPUT_DIR}")