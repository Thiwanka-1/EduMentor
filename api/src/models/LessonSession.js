import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "tutor", "system"],
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "voice", "file", "lesson", "motivation", "system"],
      default: "text",
    },
    audioUrl: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const LessonSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "Untitled Lesson",
      trim: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    languageMode: {
      type: String,
      enum: ["english", "sinhala", "singlish","tamil"],
      default: "english",
    },

    docId: {
      type: String,
      default: "",
    },

    sourceType: {
      type: String,
      enum: ["text", "voice", "document"],
      default: "text",
    },

    lessonStarted: {
      type: Boolean,
      default: false,
    },

    notesText: {
      type: String,
      default: "",
    },

    summaryText: {
      type: String,
      default: "",
    },

    audioUrl: {
      type: String,
      default: "",
    },

    videoUrl: {
      type: String,
      default: "",
    },

    messages: {
      type: [MessageSchema],
      default: [],
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LessonSession", LessonSessionSchema);