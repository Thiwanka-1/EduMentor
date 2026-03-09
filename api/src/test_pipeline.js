import dotenv from "dotenv";
import path from "path";

// Importing functions
import { saveMaterial } from "./src/services/materialStore.js";
import { buildQuizPrompt } from "./src/utils/promptBuilder.js";
import { generate } from "./src/services/ollama.service.js";
import { sanitizeJSON } from "./src/utils/jsonSanitizer.js";

async function testPipeline() {
  const BASE = "http://localhost:5050";

  console.log("  EduMentor Pipeline Test");
  console.log("\n");

  console.log(" Step 1: Health check...");
  const health = await fetch(`${BASE}/api/quiz/health`).then((r) => r.json());
  console.log("  Ollama:", health.ollama);
  if (!health.ollama.ok) {
    console.error("   Ollama is not accessible. Stopping.");
    return;
  }
  console.log(
    "   Ollama is running. Model available:",
    health.ollama.modelAvailable,
  );

  console.log("\n Step 2: Saving test study material...");
  const testText = `Chapter 1: The Water Cycle

The water cycle (hydrological cycle) describes the continuous movement of water on Earth.

Key Processes:
1. Evaporation: Water from oceans and lakes is heated by the sun and turns into water vapor.
2. Condensation: Water vapor rises, cools, and condenses into clouds.
3. Precipitation: Water droplets in clouds fall as rain, snow, sleet, or hail.
4. Collection: Water collects in oceans, rivers, lakes, and groundwater.
5. Transpiration: Plants release water vapor through their leaves.

The sun is the primary energy source driving the water cycle. It is critical for distributing freshwater around the planet.`;

  const materialId = saveMaterial(
    [
      {
        originalname: "water_cycle_test.txt",
        mimetype: "text/plain",
        size: testText.length,
      },
    ],
    testText,
  );
  console.log("   Material saved. ID:", materialId);
  console.log("  Text length:", testText.length, "chars");

  console.log("\n Step 3: Building prompt...");
  const prompt = buildQuizPrompt({
    studyText: testText,
    questionType: "multiple_choice",
    difficulty: "easy",
    quantity: 3,
  });

  console.log("   Prompt built. Length:", prompt.length, "chars");
  console.log("\n   FULL PROMPT ");
  console.log(prompt);
  console.log("   END OF PROMPT \n");

  console.log(" Step 4: Sending to Ollama (wait 1-3 minutes)...");
  const raw = await generate(prompt);
  console.log("\n   RAW OLLAMA RESPONSE ");
  console.log(raw);
  console.log("   END RESPONSE \n");

  console.log(" Step 5: Parsing JSON...");
  const parsed = sanitizeJSON(raw);
  const questions = parsed.questions || parsed;

  console.log("\n   PARSED QUESTIONS ");
  questions.forEach((q, i) => {
    console.log(`\n  Q${i + 1}: ${q.question}`);
    if (q.options) q.options.forEach((o) => console.log(`       ${o}`));
    console.log(`   Answer: ${q.correct_answer}`);
    console.log(`   ${q.explanation}`);
  });
  console.log("\n  ");

  console.log(
    `\n PIPELINE TEST PASSED! Generated ${questions.length} questions.`,
  );
}

testPipeline().catch((err) => {
  console.error("\n PIPELINE TEST FAILED:", err.message);
  process.exit(1);
});