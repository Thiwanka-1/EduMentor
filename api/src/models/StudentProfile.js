import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    subject: { type: String, default: "" },
    date: { type: Date, default: null },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, default: "" },

    lastMood: { type: String, default: "neutral" },
    motivationLevel: { type: Number, default: 3, min: 1, max: 5 }, // ✅ start at 3
    lastCheckInAt: { type: Date, default: null },

    weakTopics: { type: [String], default: [] },
    strongTopics: { type: [String], default: [] },
    upcomingExams: { type: [examSchema], default: [] },
  },
  { timestamps: true }
);

export const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
