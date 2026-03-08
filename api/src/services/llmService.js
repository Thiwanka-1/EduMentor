import axios from "axios";
import config from "../config/model.config.js";

export async function generateLLMText(prompt) {
  try {
    const response = await axios.post(
      config.VLLM_URL,
      {
        model: config.MODEL_NAME,
        prompt: prompt,
        max_tokens: config.MAX_TOKENS,
        temperature: config.TEMPERATURE,
        stream: false
      },
      { timeout: 60000 }
    );

    return response.data.text;
  } catch (err) {
    console.error("LLM Error:", err.message);
    return "Sorry, the AI model could not generate a response.";
  }
}


