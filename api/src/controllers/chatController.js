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
 * Fixes issues with motivation scaling and topic recognition.
 */
async function runShadowObserver(message, history) {
  const prompt = `
You are an internal NLP analysis engine for a student support system.
Analyze the user's latest message. You MUST respond with ONLY a valid JSON object. No markdown, no explanations.

Rules:
1. "mood": "happy", "sad", "stressed", "tired", or "neutral". (Extreme distress = "sad").
2. "motivationChange": Integer from -4 to +4.
   - "-4" for severe distress, giving up, or suicidal thoughts.
   - "-1" or "-2" for general stress, tiredness, or sadness.
   - "0" for neutral chat.
   - "+1" or "+2" for feeling better, refreshed, or ok.
   - "+3" or "+4" for extreme motivation (e.g., "work non stop", "super ready").
3. "intent": "study", "chat", or "mixed".
4. "newWeakTopic": Topic they struggle with or say they don't know (max 3 words). null if none.
5. "newStrongTopic": Topic they are good at, explicitly understand, or say they like (max 3 words). null if none.
6. "exam": If they mention an exam, return {"subject": "Topic or 'Unknown'", "date": "Timeframe or 'Upcoming'"}. null if no exam mentioned.

--- EXAMPLES ---
User: "feel like killing myself"
{"mood":"sad","motivationChange":-4,"intent":"chat","newWeakTopic":null,"newStrongTopic":null,"exam":null}

User: "no its ok all good i am ok now i am refreshed and ready to work"
{"mood":"happy","motivationChange":2,"intent":"chat","newWeakTopic":null,"newStrongTopic":null,"exam":null}

User: "I will work non stop for the whole week to tackle this lecture module"
{"mood":"happy","motivationChange":3,"intent":"study","newWeakTopic":null,"newStrongTopic":null,"exam":null}

User: "but i am really good at java programming"
{"mood":"happy","motivationChange":1,"intent":"study","newWeakTopic":null,"newStrongTopic":"Java Programming","exam":null}

User: "i do not know anything about OOP because the exam is about OOP"
{"mood":"stressed","motivationChange":-1,"intent":"study","newWeakTopic":"OOP","newStrongTopic":null,"exam":{"subject":"OOP","date":"Upcoming"}}
--- END EXAMPLES ---

User's Latest Message: "${message}"

Output strictly in this JSON format:
`.trim();

  try {
    const rawResponse = await generateBuddyCompletion({
      messages: [{ role: "system", content: prompt }],
      max_tokens: 150,
      temperature: 0.1, // Keep this very low for logical consistency
      top_p: 0.9,
    });

    // Extract everything between the first { and the last }
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("🟡 Shadow Observer parsing failed, using fallbacks:", error.message);
    return { mood: "neutral", motivationChange: 0, intent: "chat", newWeakTopic: null, newStrongTopic: null, exam: null };
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
  if (!profile) profile = await StudentProfile.create({ userId, motivationLevel: 3 });
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
    // Only update mood if the LLM successfully detected one, otherwise keep the old one
    if (observerData.mood && observerData.mood !== "neutral") {
        profile.lastMood = observerData.mood;
    } else if (observerData.mood === "neutral" && observerData.motivationChange > 0) {
        profile.lastMood = "happy"; // If they are neutral but motivation goes up, they are happy/good
    }

    // Safely update motivation between 1 and 5 (allowing larger jumps now)
    const newMotivation = profile.motivationLevel + observerData.motivationChange;
    profile.motivationLevel = Math.max(1, Math.min(5, newMotivation));

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
      intent: observerData.intent,
      extractedInsights: {
        newWeakTopic: observerData.newWeakTopic,
        newStrongTopic: observerData.newStrongTopic,
        exam: observerData.exam
      }
    });

  } catch (err) {
    console.error("chatWithBuddy error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}