import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['multiple_choice', 'true_false', 'short_answer'], required: true },
  questionText: { type: String, required: true },
  options: [{ type: String }], // Only populated for multiple_choice
  correctAnswer: { type: String, required: true },
  explanation: { type: String }, // Good for the "Quiz History" review section
  topicTag: { type: String } // Crucial for tracking weak points
});

const quizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' }, // Null if generated purely from weak points
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Quiz', quizSchema);