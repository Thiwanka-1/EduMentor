export default {
  VLLM_URL: process.env.VLLM_URL || "http://localhost:8001/generate",
  MODEL_NAME: "meta-llama/Meta-Llama-3.1-8B-Instruct",
  MAX_TOKENS: 350,
  TEMPERATURE: 0.2
};
