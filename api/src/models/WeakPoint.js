import mongoose from 'mongoose';

const weakPointSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  failureCount: { type: Number, default: 1 }, // How many times they got this wrong
  sourceFunction: { type: String, enum: ['studybuddy', 'tutor', 'multiview', 'quiz_engine'] },
  lastFailedAt: { type: Date, default: Date.now },
  mastered: { type: Boolean, default: false } // Turns true when they finally pass a quiz on it
});

export default mongoose.model('WeakPoint', weakPointSchema);