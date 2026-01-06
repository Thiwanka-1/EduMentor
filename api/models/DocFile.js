import mongoose from "mongoose";

const docFileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    docId: { type: String, required: true, index: true },

    title: { type: String, required: true },
    originalName: { type: String, default: "" },

    // local disk path OR firebase URL (we can switch later)
    storagePath: { type: String, required: true },
    storageType: { type: String, enum: ["local", "firebase"], default: "local" },
  },
  { timestamps: true }
);

export const DocFile = mongoose.model("DocFile", docFileSchema);
