// controllers/chatController.js
import "../config/env.js";
import { hf, HF_CHAT_MODEL } from "../config/hfClient.js";

import { ConversationMessage } from "../models/ConversationMessage.js";
import { StudentProfile } from "../models/StudentProfile.js";
import { ChatSession } from "../models/ChatSession.js";
import { retrieveStudyContext, buildContextText } from "./docController.js";

// -------- mood detection (better) --------
function detectMood(text) {
  const t = text.toLowerCase();

  if (/(suicid|kill myself|end it)/.test(t)) return "very_low"; // you can handle later
  if (/(stressed|overwhelmed|panic|anxious|pressure|burnt out)/.test(t)) return "stressed";
  if (/(sad|down|depressed|cry|hurt|lonely|not ok)/.test(t)) return "sad";
  if (/(tired|exhausted|sleepy|no energy|fatigued)/.test(t)) return "tired";

  // common “not good” patterns
  if (/(not good|feeling bad|bad day|i'm bad|i am bad|fed up|done with)/.test(t)) return "sad";
  if (/(happy|great|awesome|good day|excited|proud|finally did it)/.test(t)) return "happy";

  return "neutral";
}

// -------- intent detection (internal only) --------
function detectIntent(text) {
  const t = text.toLowerCase();
  const studyHits =
    /(what is|explain|define|difference between|how does|advantages|disadvantages|deadlock|os |operating system|devops|architecture|algorithm|data structure|time complexity|space complexity|lecture|slide|topic|unit|mcq|past paper|exam question)/.test(
      t
    );
  const emotionHits =
    /(stressed|overwhelmed|sad|down|tired|burnt out|panic|anxious|not good|feeling bad|lonely)/.test(
      t
    );

  if (studyHits && emotionHits) return "mixed";
  if (studyHits) return "study";
  return "chat";
}

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

// very small exam extractor
function extractExamMention(message) {
  const t = message.toLowerCase();
  if (!t.includes("exam") && !t.includes("test") && !t.includes("quiz")) return null;

  // subject: try "exam on X" or "exam for X"
  let subject = "";
  const m1 = message.match(/exam\s+(on|for)\s+([a-zA-Z0-9 _-]{2,40})/i);
  if (m1) subject = m1[2].trim();

  // date: "tomorrow" / "today" (simple)
  let date = null;
  if (/tomorrow/i.test(message)) {
    date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else if (/today/i.test(message)) {
    date = new Date();
  }

  return { subject, date, note: message.slice(0, 120) };
}

function buildSystemPrompt(profile, contextText, intent) {
  const examsStr =
    profile.upcomingExams?.length
      ? profile.upcomingExams
          .slice(0, 3)
          .map((e) => `${e.subject || "an exam"}${e.date ? ` on ${new Date(e.date).toLocaleDateString("en-GB")}` : ""}`)
          .join(", ")
      : "no specific exams recorded";

  const weak = profile.weakTopics?.length ? profile.weakTopics.join(", ") : "not clearly known yet";
  const strong = profile.strongTopics?.length ? profile.strongTopics.join(", ") : "not clearly known yet";

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
- DO NOT use bullet points or numbered lists unless the user explicitly asks: "steps", "list", "points".

Core behavior (every reply):
1) React as a friend first (1–2 short sentences).
2) If study-related, explain simply like you're sitting next to them (2–4 short paragraphs).
3) Always end with ONE short follow-up question (feelings or understanding).

Memory:
- Weak topics: ${weak}
- Strong topics: ${strong}
- Upcoming exams: ${examsStr}
- Motivation: ${profile.motivationLevel}/5, last mood: ${profile.lastMood}

Internal hint (do not reveal):
- intent: ${intent}

Hard rules:
- No headings like "Answer:".
- No long essays.
- If context is missing, ask them to upload notes for this chat.

${ctxPart}
`.trim();
}

// remove bullet lists + ensure ending question
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
    const items = bullets
      .map((l) => l.replace(/^\s*(\d+\.|[-*•])\s+/, "").replace(/\*\*/g, "").trim())
      .filter(Boolean);

    if (items.length) {
      const para = items
        .map((it, i) => (i === 0 ? `First, ${it}` : i === items.length - 1 ? `Finally, ${it}` : `Then, ${it}`))
        .join(" ");
      keep.push(para);
    }
  }

  let result = keep.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();

  if (!/[?？！]\s*$/.test(result)) {
    result += "\n\nWhat part feels most confusing right now?";
  }
  return result;
}

export async function chatWithBuddy(req, res) {
  try {
    const { userId, sessionId, message } = req.body;
    if (!userId || !sessionId || !message) {
      return res.status(400).json({ error: "userId, sessionId, message are required" });
    }

    // ensure session exists for this user
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ error: "Session not found for this user." });

    // profile updates
    const profile = await getOrCreateProfile(userId);

    const mood = detectMood(message);
    const intent = detectIntent(message);

    // motivation: don’t keep crashing to 1 forever
    const prevMood = profile.lastMood || "neutral";
    profile.lastMood = mood;

    if (["sad", "stressed", "tired"].includes(mood) && mood !== prevMood) {
      profile.motivationLevel = Math.max(1, profile.motivationLevel - 1);
    } else if (mood === "happy" && mood !== prevMood) {
      profile.motivationLevel = Math.min(5, profile.motivationLevel + 1);
    }

    // exam extraction
    const exam = extractExamMention(message);
    if (exam) {
      // avoid duplicates (same note)
      const exists = profile.upcomingExams.some((e) => e.note === exam.note);
      if (!exists) profile.upcomingExams.unshift(exam);
      profile.upcomingExams = profile.upcomingExams.slice(0, 10);
    }

    if (needsCheckIn(profile)) profile.lastCheckInAt = new Date();
    await profile.save();

    // store user msg
    await ConversationMessage.create({ userId, sessionId, role: "user", content: message });

    // history for this session ONLY
    const historyDocs = await ConversationMessage.find({ userId, sessionId })
      .sort({ createdAt: -1 })
      .limit(14)
      .lean();
    const history = historyDocs.reverse();

    // RAG context for this session
    const contextBlocks = await retrieveStudyContext(userId, sessionId, message, 5);
    const contextText = buildContextText(contextBlocks);

    const systemPrompt = buildSystemPrompt(profile, contextText, intent);

    const messages = [{ role: "system", content: systemPrompt }];
    for (const h of history) messages.push({ role: h.role, content: h.content });
    messages.push({ role: "user", content: message });

    const completion = await hf.chatCompletion({
      model: HF_CHAT_MODEL,
      messages,
      max_tokens: 340,
      temperature: 0.6,
    });

    let reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I got stuck. Can you say that again?";

    reply = formatBuddyReply(reply);

    await ConversationMessage.create({ userId, sessionId, role: "assistant", content: reply });

    // update session lastMessageAt
    await ChatSession.updateOne({ _id: sessionId, userId }, { lastMessageAt: new Date() });

    return res.json({
      reply,
      mood,
      motivationLevel: profile.motivationLevel,
      contextUsed: contextBlocks.length > 0,
      intent,
    });
  } catch (err) {
    console.error("chatWithBuddy error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
