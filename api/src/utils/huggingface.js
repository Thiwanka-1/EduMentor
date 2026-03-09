import { InferenceClient } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
const MODEL_ID = 'mistralai/Mixtral-8x7B-Instruct-v0.1'; 

export const generateAIQuiz = async (textContext, config) => {
  const { quantity, difficulty, type } = config;

  // We enforce strict JSON output in the prompt
  const prompt = `You are an expert educational AI. Based on the provided educational text, generate exactly ${quantity} ${difficulty}-level questions of type "${type}". 
  
  The output MUST be a valid JSON array of objects. Do not include any other text, markdown formatting, or explanations outside the JSON array.
  
  For multiple_choice, use this format:
  [{"type": "multiple_choice", "questionText": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "...", "explanation": "...", "topicTag": "..."}]
  
  For true_false, use this format:
  [{"type": "true_false", "questionText": "...", "correctAnswer": "True or False", "explanation": "...", "topicTag": "..."}]
  
  For short_answer, use this format:
  [{"type": "short_answer", "questionText": "...", "correctAnswer": "...", "explanation": "...", "topicTag": "..."}]
  
  Text context: ${textContext.substring(0, 15000)} // Limiting text to avoid token limits
  `;

  try {
    const response = await hf.chatCompletion({
      model: MODEL_ID,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2500,
      temperature: 0.2, // Low temperature for more deterministic, factual output
    });

    let rawContent = response.choices[0].message.content;
    
    // Sometimes models wrap JSON in markdown block ticks. We clean that up just in case.
    rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(rawContent);
  } catch (error) {
    console.error("Error communicating with Hugging Face:", error);
    throw new Error("Failed to generate quiz from AI");
  }
};

export const generateQuizFromTopics = async (topicsArray, config) => {
  const { quantity, difficulty, type } = config;
  const topicsList = topicsArray.join(', ');

  const prompt = `You are an expert adaptive tutor. Generate exactly ${quantity} ${difficulty}-level questions of type "${type}". 
  The questions MUST specifically test the student's knowledge on these exact topics: ${topicsList}.
  
  The output MUST be a valid JSON array of objects. Do not include any other text, markdown formatting, or explanations.
  
  Format exactly like this depending on the type:
  [{"type": "${type}", "questionText": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "...", "explanation": "...", "topicTag": "..."}]
  `;

  try {
    const response = await hf.chatCompletion({
      model: MODEL_ID,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2500,
      temperature: 0.3, 
    });

    let rawContent = response.choices[0].message.content;
    rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(rawContent);
  } catch (error) {
    console.error("Error communicating with Hugging Face:", error);
    throw new Error("Failed to generate adaptive quiz from topics");
  }
};