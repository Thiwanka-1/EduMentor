// models/StudyNote.js
import mongoose from "mongoose";

const studyNoteSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true }, // Stores the full markdown summary
  },
  { timestamps: true }
);

export const StudyNote = mongoose.model("StudyNote", studyNoteSchema);