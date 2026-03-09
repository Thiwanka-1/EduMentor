import mongoose from "mongoose";

const conversationMessageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const ConversationMessage = mongoose.model("ConversationMessage", conversationMessageSchema);
