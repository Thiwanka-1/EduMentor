// ──────────────────────────────────────────────────────────────
// Material Model — MongoDB Schema
// ──────────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled Material",
    },
    files: [
      {
        originalname: String,
        mimetype: String,
        size: Number,
      },
    ],
    textContent: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: "mixed",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for sorting by upload date
materialSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model("Material", materialSchema);
