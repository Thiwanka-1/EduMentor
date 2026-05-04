// models/JointPlan.js
import mongoose from "mongoose";

const jointPlanSchema = new mongoose.Schema({
  tutorId: { type: String, required: true, index: true },
  learnerId: { type: String, required: true, index: true },
  topic: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export const JointPlan = mongoose.model("JointPlan", jointPlanSchema);