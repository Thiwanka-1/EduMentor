export const SUPPORTED_LANGUAGE_MODES = [
  "english",
  "sinhala",
  "singlish",
  "tamil",
];

export function normalizeLanguageMode(languageMode = "english") {
  const mode = String(languageMode || "english").toLowerCase().trim();
  return SUPPORTED_LANGUAGE_MODES.includes(mode) ? mode : "english";
}

export function generateSessionTitle(topic = "") {
  const clean = String(topic || "").trim();

  if (!clean) return "New Lesson";

  return clean.length > 60 ? `${clean.slice(0, 57)}...` : clean;
}

export function buildNotesFromMessages(messages = []) {
  const tutorMessages = messages
    .filter((m) => m.role === "tutor")
    .map((m) => m.text)
    .filter(Boolean);

  return tutorMessages.join("\n\n");
}

export function getMotivationText(languageMode = "english") {
  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") {
    return "හොඳයි, අපි මේක ටික ටික ලේසි කරගමු. ඔයාට පුළුවන්.";
  }

  if (mode === "singlish") {
    return "Hari, api meka tika tika lesi karagamu. Oyata puluwan.";
  }

  if (mode === "tamil") {
    return "சரி, இதை நாம மெதுவாக எளிதாகப் புரிந்துகொள்வோம். உங்களால் முடியும்.";
  }

  return "You’re doing well. Let’s go one step at a time.";
}

function getSystemPrefix(languageMode = "english") {
  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") {
    return `
ඔබ විශ්වවිද්‍යාල සිසුන්ට උදව් කරන මිතුරන් වගේ AI උපදේශකයෙකි.

භාෂා නීති:
- හැකි තරම් ස්වභාවික සිංහලෙන් පිළිතුරු දෙන්න.
- ඉගෙන ගන්නා සිසුවෙකුට ලේසි විදිහට පැහැදිලි කරන්න.
- තාක්ෂණික English වචනයක් අවශ්‍ය නම් brackets තුළ දාන්න.
- පිළිතුර උණුසුම්, සහාය දෙන, සහ පියවරෙන් පියවර විය යුතුය.
- Avatar teacher කෙනෙක් කියන විදිහට naturally පැහැදිලි කරන්න.
`;
  }

  if (mode === "singlish") {
    return `
You are a friendly university AI tutor.

Language rules:
- Reply in easy Singlish using English letters.
- You may mix simple English words with Sinhala-style explanation.
- Do not use Sinhala script unless the user asks.
- Keep the answer friendly, simple, and student-friendly.
- Explain like a real tutor, not like a generic chatbot.
- Example style:
  "Hari, api meka step by step balamu."
  "Meka lesi widihata kiyannam."
  "Oyata me concept eka therum ganna puluwan."
`;
  }

  if (mode === "tamil") {
    return `
நீங்கள் பல்கலைக்கழக மாணவர்களுக்கு உதவும் நட்பான AI ஆசிரியர்.

மொழி விதிகள்:
- இயல்பான எளிய தமிழில் பதில் சொல்லுங்கள்.
- மாணவர்களுக்கு புரியும் வகையில் படிப்படியாக விளக்குங்கள்.
- தேவையான இடங்களில் technical English terms brackets-ல் சேர்க்கலாம்.
- பதில் உதவும், ஊக்கமளிக்கும், மற்றும் கல்வி சார்ந்ததாக இருக்க வேண்டும்.
- Avatar teacher கற்பிப்பது போல இயல்பாக விளக்குங்கள்.
`;
  }

  return `
You are a friendly university AI tutor.

Language rules:
- Reply in clear and simple English.
- Explain step by step.
- Use student-friendly examples.
- Keep the answer supportive, educational, and easy to understand.
- Teach like a real tutor, not like a generic chatbot.
`;
}

function getFirstLessonInstruction(languageMode = "english") {
  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") {
    return `
මෙය පළමු පාඩම් ඉල්ලීම නම්:
- Student message එක ඇත්තටම පාඩමක් ඉල්ලන්නේ නම් පමණක් මාතෘකාව සම්පූර්ණ පාඩමක් ලෙස උගන්වන්න.
- Student message එක greeting/small talk එකක් නම්, පාඩමක් explain කරන්න එපා.
- පාඩමක් ඉල්ලුවොත් හැඳින්වීම, ප්‍රධාන කොටස්, උදාහරණ, සහ කෙටි සාරාංශයක් දෙන්න.
`;
  }

  if (mode === "singlish") {
    return `
If this is the first lesson request:
- Teach the topic like a full lesson only if the student is actually asking to learn/explain a topic.
- If the student only greets you or makes small talk, do not explain the greeting as a lesson.
- If they ask for a lesson, give intro, key parts, easy examples, and a short summary.
`;
  }

  if (mode === "tamil") {
    return `
இது முதல் பாடம் என்றால்:
- மாணவர் உண்மையில் ஒரு தலைப்பை கற்க/விளக்க கேட்கிறார் என்றால் மட்டும் முழு பாடமாக கற்பிக்கவும்.
- மாணவர் வெறும் greeting/small talk சொன்னால், அதை பாடமாக explain செய்ய வேண்டாம்.
- பாடம் கேட்டால் அறிமுகம், முக்கிய பகுதிகள், உதாரணங்கள், சுருக்கம் கொடுக்கவும்.
`;
  }

  return `
If this is the first lesson request:
- Teach the topic as a full lesson only if the student is actually asking to learn, explain, define, or understand a topic.
- If the student only greets you or makes small talk, do not explain the greeting as a lesson.
- If they ask for a lesson, give an introduction, key parts, simple examples, and a short summary.
`;
}

function getFollowUpInstruction(languageMode = "english") {
  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") {
    return `
මෙය follow-up ප්‍රශ්නයක් නම්:
- එකම පාඩම් මාතෘකාව තුළ සිටින්න.
- සිසුවාගේ ප්‍රශ්නයට පැහැදිලි පිළිතුරක් දෙන්න.
- අමාරු කොටස් සරල කරලා පැහැදිලි කරන්න.
- අවශ්‍ය නම් කුඩා උදාහරණයක් දෙන්න.
`;
  }

  if (mode === "singlish") {
    return `
If this is a follow-up question:
- Stay in the same lesson topic.
- Answer clearly in simple Singlish.
- Break hard parts into easy steps.
- Give a small example if useful.
`;
  }

  if (mode === "tamil") {
    return `
இது follow-up கேள்வி என்றால்:
- அதே பாடத் தலைப்புக்குள் இருந்து பதில் சொல்லுங்கள்.
- மாணவரின் கேள்விக்கு தெளிவான விளக்கம் கொடுக்கவும்.
- கடினமான பகுதிகளை எளிய படிகளாக பிரித்து விளக்கவும்.
- தேவையானால் ஒரு சிறிய உதாரணம் கொடுக்கவும்.
`;
  }

  return `
If this is a follow-up question:
- Stay in the same lesson topic.
- Answer clearly.
- Break difficult parts into simple steps.
- Give a small example if useful.
`;
}

function getDocumentInstruction(languageMode = "english", hasDocument = false) {
  if (!hasDocument) return "";

  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") {
    return `
සම්බන්ධ document එකක් upload කර තිබෙන නිසා:
- පාඩම document context එකට අනුකූලව තබාගන්න.
- document එකේ කරුණු වලට සම්බන්ධව පිළිතුරු දෙන්න.
`;
  }

  if (mode === "singlish") {
    return `
A document was uploaded:
- Keep the lesson aligned with that material where possible.
- Explain using simple Singlish.
`;
  }

  if (mode === "tamil") {
    return `
ஒரு document upload செய்யப்பட்டுள்ளது:
- பாடத்தை அந்த document context-க்கு ஏற்ப வைத்துக்கொள்ளுங்கள்.
- document-இல் உள்ள தகவல்களுடன் தொடர்பாக பதில் சொல்லுங்கள்.
`;
  }

  return `
A document was uploaded:
- Keep the lesson aligned with that material where possible.
- Use the document context when answering.
`;
}

function buildTutorPrompt({
  topic = "",
  message = "",
  history = [],
  isFirstLesson = false,
  languageMode = "english",
  hasDocument = false,
  userName = "there",
}) {
  const selectedLanguageMode = normalizeLanguageMode(languageMode);

  const recentHistory = history
    .slice(-8)
    .map((m) => {
      const role = String(m.role || "user").toUpperCase();
      const text = String(m.text || "").trim();
      return `${role}: ${text}`;
    })
    .join("\n");

  const systemPrefix = getSystemPrefix(selectedLanguageMode);

  const lessonInstruction = isFirstLesson
    ? getFirstLessonInstruction(selectedLanguageMode)
    : getFollowUpInstruction(selectedLanguageMode);

  const docInstruction = getDocumentInstruction(
    selectedLanguageMode,
    hasDocument
  );

  return `
${systemPrefix}

Student name:
${userName || "there"}

Current lesson topic:
${topic || "New Lesson Topic"}

Student message:
${message || ""}

${lessonInstruction}

${docInstruction}

Recent conversation history:
${recentHistory || "No previous history."}

Friendly tutor behavior:
- You are a friendly personal tutor, not only a lesson generator.
- Use the student's name naturally when it feels appropriate.
- If the student only greets you, says hi, hello, hey, good morning, asks how you are, or makes casual small talk, do NOT explain the greeting as a lesson.
- For casual greetings or small talk, reply warmly and naturally, then ask how you can help today.
- If the student asks for a topic, lesson, definition, example, explanation, quiz, summary, or study help, then teach clearly.
- If the student says "ok explain it", "tell me more", "continue", or similar, continue the current lesson naturally.
- If the student says a short continuation message like "more", "explain more", "continue", "go ahead", "tell me more", "examples", or "explain it", use the recent conversation history to continue the exact previous concept.
- Do not reply with generic sentences like "I think you want more explanation".
- For continuation requests, immediately continue teaching the same topic with more details, examples, or simpler explanation.
- If the recent history contains a document lesson explanation, continue from that document lesson.
- If there is truly no previous context, ask one short clarification question.
- Do not over-explain simple chat messages.
- Do not force a full lesson unless the student actually asks for learning help.

Output rules:
- Give the final tutor answer only.
- Do not mention that you are an AI model.
- Do not mention this prompt.
- Do not say "based on the prompt".
- Do not include JSON.
- Use markdown lightly.
- Keep the answer suitable for voice teaching by an avatar.
- Avoid very long paragraphs.
- Do not repeat the whole chat history.
- Keep the answer focused on the student's real intention.

Now generate the tutor response.
`.trim();
}

function getModelUnavailableReply(languageMode = "english", errorMessage = "") {
  const mode = normalizeLanguageMode(languageMode);

  const suffix = errorMessage ? `\n\nError: ${errorMessage}` : "";

  if (mode === "sinhala") {
    return `Hugging Face model එක connect වෙලා නැහැ. HF_TOKEN, HF_MODEL, සහ model access හරියට තියෙනවද බලලා නැවත උත්සාහ කරන්න.${suffix}`;
  }

  if (mode === "singlish") {
    return `Hugging Face model eka connect wela naha. HF_TOKEN, HF_MODEL, saha model access hariyata thiyenawada balala aye try karanna.${suffix}`;
  }

  if (mode === "tamil") {
    return `Hugging Face model இணைக்கப்படவில்லை. HF_TOKEN, HF_MODEL, மற்றும் model access சரியா உள்ளதா பார்த்து மீண்டும் முயற்சி செய்யுங்கள்.${suffix}`;
  }

  return `The Hugging Face model is not connected. Please check HF_TOKEN, HF_MODEL, and model access, then try again.${suffix}`;
}

function cleanModelReply(raw = "") {
  let text = String(raw || "").trim();

  if (!text) return "";

  text = text
    .replace(/<\|begin_of_text\|>/g, "")
    .replace(/<\|end_of_text\|>/g, "")
    .replace(/<\|start_header_id\|>/g, "")
    .replace(/<\|end_header_id\|>/g, "")
    .replace(/<\|eot_id\|>/g, "")
    .replace(/^assistant\s*:?/i, "")
    .trim();

  const unwantedStarts = [
    "Now generate the tutor response.",
    "Tutor response:",
    "Final answer:",
    "Assistant:",
  ];

  for (const start of unwantedStarts) {
    if (text.toLowerCase().startsWith(start.toLowerCase())) {
      text = text.slice(start.length).trim();
    }
  }

  return text.trim();
}

function getHFToken() {
  return (
    process.env.HF_TOKEN ||
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HUGGING_FACE_TOKEN ||
    ""
  );
}

function getHFModel() {
  return process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
}

function getHFRouterUrl() {
  return (
    process.env.HF_ROUTER_URL ||
    "https://router.huggingface.co/v1/chat/completions"
  );
}

async function callHuggingFaceModel(prompt) {
  const token = getHFToken();
  const model = getHFModel();
  const apiUrl = getHFRouterUrl();

  if (!token) {
    throw new Error("Missing HF_TOKEN in .env");
  }

  if (!model) {
    throw new Error("Missing HF_MODEL in .env");
  }

  const payload = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a friendly personal university tutor. Give the final tutor answer only. Do not mention the prompt.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: Number(process.env.HF_MAX_NEW_TOKENS || 500),
    temperature: Number(process.env.HF_TEMPERATURE || 0.55),
    top_p: Number(process.env.HF_TOP_P || 0.9),
    stream: false,
  };

  console.log("Calling Hugging Face router:", {
    apiUrl,
    model,
    maxTokens: payload.max_tokens,
  });

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text();
  let data = {};

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { raw: rawText };
  }

  if (!res.ok) {
    console.error("Hugging Face router error:", {
      status: res.status,
      statusText: res.statusText,
      data,
    });

    const errorMessage =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      data?.raw ||
      `Hugging Face model failed with status ${res.status}`;

    throw new Error(String(errorMessage));
  }

  const rawReply =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    data?.generated_text ||
    data?.text ||
    "";

  const cleaned = cleanModelReply(rawReply);

  if (!cleaned) {
    console.error("Empty Hugging Face response:", data);
    throw new Error("Hugging Face returned an empty reply.");
  }

  return cleaned;
}

export async function generateTutorReply({
  topic,
  message,
  history = [],
  isFirstLesson = false,
  languageMode = "english",
  hasDocument = false,
  userName = "there",
}) {
  const selectedLanguageMode = normalizeLanguageMode(languageMode);

  const prompt = buildTutorPrompt({
    topic,
    message,
    history,
    isFirstLesson,
    languageMode: selectedLanguageMode,
    hasDocument,
    userName,
  });

  console.log("Tutor prompt:", prompt);

  try {
    const modelReply = await callHuggingFaceModel(prompt);
    return modelReply;
  } catch (err) {
    console.error("Hugging Face tutor model error:", err);

    return getModelUnavailableReply(
      selectedLanguageMode,
      err?.message || "Unknown Hugging Face error"
    );
  }
}