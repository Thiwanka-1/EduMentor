import mongoose from "mongoose";

const docChunkSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    docId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    page: { type: Number, default: 1 },

    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

export const DocChunk = mongoose.model("DocChunk", docChunkSchema);
