import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
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

export default mongoose.model("Material", materialSchema);