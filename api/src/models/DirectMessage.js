// models/DirectMessage.js
import mongoose from "mongoose";

const dmSchema = new mongoose.Schema({
  senderId: { type: String, required: true, index: true },
  receiverId: { type: String, required: true, index: true },
  text: { type: String, required: true },
}, { timestamps: true });

export const DirectMessage = mongoose.model("DirectMessage", dmSchema);