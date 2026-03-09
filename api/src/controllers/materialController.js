import Material from '../models/Material.js';
import { createRequire } from 'module';

// Initialize 'require' to safely load CommonJS modules in an ES Module environment
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Extract text from the uploaded PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;

    // Save to database using the authenticated user's ID
    const newMaterial = new Material({
      userId: req.user._id, 
      fileName: req.file.originalname,
      extractedText: extractedText
    });

    await newMaterial.save();

    res.status(201).json({ 
      message: 'File parsed and saved successfully', 
      materialId: newMaterial._id 
    });

  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ message: 'Server error during file processing' });
  }
};