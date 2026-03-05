// ──────────────────────────────────────────────────────────────
// StudentProfile Model — Friend Component data model
// Stores weak/strong topics and other student metadata.
// Already used by the Friend component; defined here for
// ACE to read/update weakTopics and strongTopics.
// ──────────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    subject: { type: String, default: "" },
    date: { type: Date, default: null },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, default: "" },

    lastMood: { type: String, default: "neutral" },
    motivationLevel: { type: Number, default: 3, min: 1, max: 5 },
    lastCheckInAt: { type: Date, default: null },

    weakTopics: { type: [String], default: [] },
    strongTopics: { type: [String], default: [] },

    upcomingExams: { type: [examSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
