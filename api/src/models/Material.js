import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  extractedText: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
});

export default mongoose.model('Material', materialSchema);