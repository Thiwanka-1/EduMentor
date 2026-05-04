// controllers/chatController.js
import "../config/env.js";
import { generateBuddyCompletion } from "../config/llmClient.js";

import { ConversationMessage } from "../models/ConversationMessage.js";
import { StudentProfile } from "../models/StudentProfile.js";
import { ChatSession } from "../models/ChatSession.js";
import { retrieveStudyContext, buildContextText } from "./docController.js";

// ==========================================
// THE SHADOW OBSERVER (NLP / Sentiment Engine)
// ==========================================
/**
 * Uses Few-Shot Prompting to force the LLM to extract accurate JSON data.
 * Changed to Absolute State Tracking for 100% reliable motivation updates.
 */
async function runShadowObserver(message, history) {
  const prompt = `
You are an internal NLP analysis engine for a student support system.
Analyze the user's latest message. You MUST respond with ONLY a valid JSON object. No markdown, no explanations.

Rules:
1. "mood": "happy", "sad", "stressed", "tired", or "neutral".
2. "motivationLevel": Integer from 1 to 5 representing their CURRENT state.
   - 1: Giving up, severe distress, zero motivation.
   - 2: Low motivation, procrastinating, tired, slightly stressed.
   - 3: Neutral baseline, chilling, normal chat.
   - 4: Good motivation, ready to study, positive.
   - 5: Extreme motivation, working non-stop, hyper-focused.
3. "intent": "study", "chat", or "mixed".
4. "newWeakTopic": Topic they struggle with or say they don't know (max 3 words). null if none.
5. "newStrongTopic": Topic they are good at, explicitly understand, or say they like (max 3 words). null if none.
6. "exam": If they mention an exam, return {"subject": "Topic or 'Unknown'", "date": "Timeframe or 'Upcoming'"}. null if no exam mentioned.

--- EXAMPLES ---
User: "hi"
{"mood":"neutral","motivationLevel":3,"intent":"chat","newWeakTopic":null,"newStrongTopic":null,"exam":null}

User: "good"
{"mood":"happy","motivationLevel":4,"intent":"chat","newWeakTopic":null,"newStrongTopic":null,"exam":null}

User: "nope just chilling"
{"mood":"neutral","motivationLevel":3,"intent":"chat","newWeakTopic":null,"newStrongTopic":null,"exam":null}

User: "but i start studing for the exam now and will do until i got everything sorted"
{"mood":"happy","motivationLevel":5,"intent":"study","newWeakTopic":null,"newStrongTopic":null,"exam":{"subject":"Unknown","date":"Upcoming"}}

User: "i will for this whole week for the exam"
{"mood":"happy","motivationLevel":5,"intent":"study","newWeakTopic":null,"newStrongTopic":null,"exam":{"subject":"Unknown","date":"Upcoming"}}

User: "i do not know anything about OOP because the exam is about OOP"
{"mood":"stressed","motivationLevel":2,"intent":"study","newWeakTopic":"OOP","newStrongTopic":null,"exam":{"subject":"OOP","date":"Upcoming"}}

User: "feel like killing myself"
{"mood":"sad","motivationLevel":1,"intent":"chat","newWeakTopic":null,"newStrongTopic":null,"exam":null}
--- END EXAMPLES ---

User's Latest Message: "${message}"

Output strictly in this JSON format:
`.trim();

  try {
    const rawResponse = await generateBuddyCompletion({
      messages: [{ role: "system", content: prompt }],
      max_tokens: 150,
      temperature: 0.0, // Dropped to 0.0 for maximum determinism
      top_p: 0.9,
    });

    // Strip markdown backticks if LLaMA randomly adds them, then parse
    let cleanText = rawResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("🟡 Shadow Observer parsing failed, using fallbacks:", error.message);
    // Return nulls so we don't overwrite valid DB data with fallbacks if an error occurs
    return { mood: null, motivationLevel: null, intent: "chat", newWeakTopic: null, newStrongTopic: null, exam: null };
  }
}

// ==========================================
// PROFILE MANAGEMENT
// ==========================================
function needsCheckIn(profile) {
  if (!profile.lastCheckInAt) return true;
  const hoursSince = (Date.now() - new Date(profile.lastCheckInAt).getTime()) / (1000 * 60 * 60);
  return hoursSince > 18;
}

async function getOrCreateProfile(userId) {
  let profile = await StudentProfile.findOne({ userId });
  if (!profile) profile = await StudentProfile.create({ userId, motivationLevel: 3, lastMood: "neutral" });
  return profile;
}

function updateUniqueList(list, newItem, maxItems = 5) {
  if (!newItem || newItem.toLowerCase() === "unknown") return list;
  const cleaned = newItem.toLowerCase().trim();
  if (!list.includes(cleaned)) {
    list.unshift(cleaned);
  }
  return list.slice(0, maxItems);
}

// ==========================================
// STUDYBUDDY PROMPT & FORMATTING
// ==========================================
function buildSystemPrompt(profile, contextText, intent) {
  const examsStr = profile.upcomingExams?.length
    ? profile.upcomingExams.map((e) => `${e.subject} (${e.note})`).join(", ")
    : "no specific exams recorded";

  const weak = profile.weakTopics?.length ? profile.weakTopics.join(", ") : "not clearly known yet";
  const strong = profile.strongTopics?.length ? profile.strongTopics.join(", ") : "not clearly known yet";

  // Emotional RAG Logic
  let emotionalContext = "";
  if (profile.motivationLevel <= 2) {
    emotionalContext = "The student's motivation is currently very low. Be extra gentle, highly encouraging, validate their stress, and break concepts down into the smallest possible pieces.";
  } else if (profile.motivationLevel >= 4) {
    emotionalContext = "The student is highly motivated right now! Match their high energy, be enthusiastic, and challenge them slightly to deepen their understanding.";
  }

  const ctxPart = contextText
    ? `\n\nStudy Context (from the student's uploaded notes):\n${contextText}\n\nUse this context for study questions. If the message is mainly emotional/life, context can be ignored.`
    : `\n\nNo study context found for this chat yet. If they ask study questions, answer generally and be honest if unsure.`;

  return `
You are "Study Buddy", a close university friend (same age).
The user NEVER has to ask you to act like a friend. You ALWAYS behave like a friend.

Style (VERY IMPORTANT):
- Warm, casual, human.
- Short paragraphs (1–3 sentences).
- Use emojis sometimes (not every line).
- Avoid formal teacher tone.
- DO NOT use bullet points or numbered lists unless the user explicitly asks.

Core behavior (every reply):
1) React as a friend first (1–2 short sentences).
2) If study-related, explain simply like you're sitting next to them.
3) Always end with ONE short follow-up question to keep the conversation going.

Memory:
- Weak topics: ${weak}
- Strong topics: ${strong}
- Upcoming exams: ${examsStr}
- Motivation Level: ${profile.motivationLevel}/5
- Current Mood: ${profile.lastMood}

Pedagogical Instruction:
${emotionalContext}

Internal hint (do not reveal):
- Intent: ${intent}

Hard rules:
- No headings like "Answer:".
- No long essays.

${ctxPart}
`.trim();
}

function formatBuddyReply(raw) {
  if (!raw) return "Sorry, I got stuck. Can you say that again?";
  let text = raw.trim();
  const lines = text.split("\n");
  const bullets = [];
  const keep = [];

  for (const line of lines) {
    if (/^\s*(\d+\.|[-*•])\s+/.test(line)) bullets.push(line);
    else if (line.trim()) keep.push(line.trim());
  }

  if (bullets.length) {
    const items = bullets.map((l) => l.replace(/^\s*(\d+\.|[-*•])\s+/, "").replace(/\*\*/g, "").trim()).filter(Boolean);
    if (items.length) {
      const para = items.map((it, i) => (i === 0 ? `First, ${it}` : i === items.length - 1 ? `Finally, ${it}` : `Then, ${it}`)).join(" ");
      keep.push(para);
    }
  }

  let result = keep.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!/[?？！]\s*$/.test(result)) {
    result += "\n\nWhat's on your mind right now?";
  }
  return result;
}

// ==========================================
// MAIN CONTROLLER
// ==========================================
export async function chatWithBuddy(req, res) {
  try {
    const userId = req.user._id;
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message are required" });
    }

    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ error: "Session not found for this user." });

    // 1. Get Profile & History
    const profile = await getOrCreateProfile(userId);
    const historyDocs = await ConversationMessage.find({ userId, sessionId }).sort({ createdAt: -1 }).limit(6).lean();
    const history = historyDocs.reverse();

    // 2. Run Shadow Observer (Sentiment & Entity Extraction)
    const observerData = await runShadowObserver(message, history);

    // 3. Update Database with Extracted Insights
    // Direct Absolute Assignment instead of messy math
    if (observerData.mood) {
        profile.lastMood = observerData.mood;
    }
    if (observerData.motivationLevel) {
        profile.motivationLevel = observerData.motivationLevel;
    }

    // Update Academic Knowledge Graph
    profile.weakTopics = updateUniqueList(profile.weakTopics, observerData.newWeakTopic);
    profile.strongTopics = updateUniqueList(profile.strongTopics, observerData.newStrongTopic);

    // Handle Exam Updates
    if (observerData.exam && observerData.exam.subject && observerData.exam.subject !== "Unknown") {
      profile.upcomingExams = profile.upcomingExams || [];
      const examExists = profile.upcomingExams.some((e) => e.subject.toLowerCase() === observerData.exam.subject.toLowerCase());
      if (!examExists) {
        profile.upcomingExams.unshift({
          subject: observerData.exam.subject,
          note: observerData.exam.date || "Upcoming",
        });
        profile.upcomingExams = profile.upcomingExams.slice(0, 5); // Keep top 5
      }
    }

    if (needsCheckIn(profile)) profile.lastCheckInAt = new Date();
    await profile.save();

    // 4. Save User Message
    await ConversationMessage.create({ userId, sessionId, role: "user", content: message });

    // 5. Emotional RAG Retrieval
    const contextBlocks = await retrieveStudyContext(userId, sessionId, message, 5);
    const contextText = buildContextText(contextBlocks);

    // 6. Build Final Prompt & Call LLM
    const systemPrompt = buildSystemPrompt(profile, contextText, observerData.intent);
    
    // Fetch a slightly longer history for the actual chat conversation context
    const fullHistoryDocs = await ConversationMessage.find({ userId, sessionId }).sort({ createdAt: -1 }).limit(14).lean();
    const fullHistory = fullHistoryDocs.reverse();

    const messages = [{ role: "system", content: systemPrompt }];
    for (const h of fullHistory) {
      if (h.content !== message) {
        messages.push({ role: h.role, content: h.content });
      }
    }
    messages.push({ role: "user", content: message });

    let reply = await generateBuddyCompletion({
      messages,
      max_tokens: 340,
      temperature: 0.6,
      top_p: 0.95,
    });

    reply = reply || "Sorry, I got stuck processing that. Can you say that again?";
    reply = formatBuddyReply(reply);

    // 7. Save Assistant Message & Update Session
    await ConversationMessage.create({ userId, sessionId, role: "assistant", content: reply });
    await ChatSession.updateOne({ _id: sessionId, userId }, { lastMessageAt: new Date() });

    // 8. Return response directly so UI shows correct mood/motivation instantly
    return res.json({
      reply,
      mood: profile.lastMood,
      motivationLevel: profile.motivationLevel,
      contextUsed: contextBlocks.length > 0,
      intent: observerData.intent || "chat",
      extractedInsights: {
        newWeakTopic: observerData.newWeakTopic || null,
        newStrongTopic: observerData.newStrongTopic || null,
        exam: observerData.exam || null
      }
    });

  } catch (err) {
    console.error("chatWithBuddy error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Add this to the bottom of controllers/chatController.js

export async function generateSessionSummary(req, res) {
  try {
    // 🚨 SECURE: Grab userId from the verified session cookie
    const userId = req.user._id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    // 1. Fetch the entire chat history for this specific session
    // We sort by createdAt: 1 to read it chronologically from start to finish
    const historyDocs = await ConversationMessage.find({ userId, sessionId })
      .sort({ createdAt: 1 })
      .lean();

    // 2. Filter out system messages and format it like a script
    const transcript = historyDocs
      .filter((msg) => msg.role !== "system")
      .map((msg) => `${msg.role === "user" ? "Student" : "StudyBuddy"}: ${msg.content}`)
      .join("\n\n");

    if (!transcript.trim()) {
      return res.status(400).json({ error: "Not enough chat history to summarize yet." });
    }

    // 3. The Synthesizer Prompt
    // We force a strict Markdown structure so it looks perfect in your UI
    const prompt = `
You are an expert academic synthesizer. Review the following transcript of a study session between a Student and a StudyBuddy. 
Your task is to generate a concise, highly structured "Short Note" study guide based ONLY on what was discussed.

Format the output strictly in Markdown with these exact sections. Do not include any other text outside of this structure.

### 📌 Session Overview
(1-2 sentences summarizing the main topic)

### 🔑 Key Concepts Covered
(Brief bullet points of definitions or facts explained in the chat)

### 🚀 Progress Made
(What the student successfully understood based on the transcript)

### ⚠️ Needs Review
(Concepts the student struggled with and should revisit)

Transcript:
${transcript}
`.trim();

    console.log("🟡 Generating Session Summary for session:", sessionId);

    // 4. Call your local LLaMA model
    // Temperature is very low (0.2) so it doesn't hallucinate facts outside the transcript
    const rawSummary = await generateBuddyCompletion({
      messages: [{ role: "system", content: prompt }],
      max_tokens: 500,
      temperature: 0.2, 
      top_p: 0.9,
    });

    if (!rawSummary) {
      throw new Error("LLM returned an empty summary.");
    }

    // 5. Send it back to the frontend
    return res.json({ summary: rawSummary.trim() });

  } catch (err) {
    console.error("generateSessionSummary error:", err);
    return res.status(500).json({ error: "Server error generating summary" });
  }
}

// Add to the bottom of controllers/chatController.js

export async function getStudentKnowledge(req, res) {
  try {
    const userId = req.user._id;
    // We already have getOrCreateProfile from earlier in the file!
    const profile = await getOrCreateProfile(userId); 
    
    return res.json({
      weakTopics: profile.weakTopics || [],
      strongTopics: profile.strongTopics || []
    });
  } catch (err) {
    console.error("getStudentKnowledge error:", err);
    return res.status(500).json({ error: "Failed to fetch knowledge graph data" });
  }
}