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
4. "newWeakTopics": ARRAY of strings for topics they struggle with or don't know. Empty array [] if none.
5. "newStrongTopics": ARRAY of strings for topics they are good at, explicitly understand, or like. Empty array [] if none.
6. "exam": If they mention an exam, return {"subject": "Topic or 'Unknown'", "date": "Timeframe or 'Upcoming'"}. null if no exam mentioned.

--- EXAMPLES ---
User: "hi"
{"mood":"neutral","motivationLevel":3,"intent":"chat","newWeakTopics":[],"newStrongTopics":[],"exam":null}

User: "i am actually really good at microservices and nodejs but i suck at OOP and databases"
{"mood":"neutral","motivationLevel":4,"intent":"study","newWeakTopics":["OOP", "Databases"],"newStrongTopics":["Microservices", "Node.js"],"exam":null}

User: "but i start studing for the exam now and will do until i got everything sorted"
{"mood":"happy","motivationLevel":5,"intent":"study","newWeakTopics":[],"newStrongTopics":[],"exam":{"subject":"Unknown","date":"Upcoming"}}

User: "i do not know anything about OOP because the exam is about OOP"
{"mood":"stressed","motivationLevel":2,"intent":"study","newWeakTopics":["OOP"],"newStrongTopics":[],"exam":{"subject":"OOP","date":"Upcoming"}}
--- END EXAMPLES ---

User's Latest Message: "${message}"

Output strictly in this JSON format:
`.trim();

  try {
    const rawResponse = await generateBuddyCompletion({
      messages: [{ role: "system", content: prompt }],
      max_tokens: 150,
      temperature: 0.0, 
      top_p: 0.9,
    });

    let cleanText = rawResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("🟡 Shadow Observer parsing failed, using fallbacks:", error.message);
    return { mood: null, motivationLevel: null, intent: "chat", newWeakTopics: [], newStrongTopics: [], exam: null };
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

function updateUniqueList(list, newItem, maxItems = 10) {
  if (!newItem || newItem.toLowerCase() === "unknown") return list;
  const cleaned = newItem.toLowerCase().trim();
  if (!list.includes(cleaned)) {
    list.unshift(cleaned);
  }
  return list.slice(0, maxItems); 
}

// ==========================================
// STUDYBUDDY PROMPT & FORMATTING (MASSIVELY UPGRADED)
// ==========================================
function buildSystemPrompt(profile, contextText, intent) {
  const examsStr = profile.upcomingExams?.length
    ? profile.upcomingExams.map((e) => `${e.subject} (${e.note})`).join(", ")
    : "no specific exams recorded";

  const weak = profile.weakTopics?.length ? profile.weakTopics.join(", ") : "not clearly known yet";
  const strong = profile.strongTopics?.length ? profile.strongTopics.join(", ") : "not clearly known yet";

  let emotionalContext = "";
  if (profile.motivationLevel <= 2) {
    emotionalContext = "The student is stressed or unmotivated. Validate their feelings first (e.g., 'Ugh, I get it, that stuff is brutal'). Don't overwhelm them with huge paragraphs. Ask how they are holding up.";
  } else if (profile.motivationLevel >= 4) {
    emotionalContext = "The student is highly motivated! Match their energy and encourage their progress.";
  }

  const ctxPart = contextText
    ? `\n\nStudy Context (from the student's uploaded notes):\n${contextText}\n\nOnly use this context if it directly answers what they are currently struggling with.`
    : `\n\nNo uploaded study context. Use your general knowledge.`;

  return `
You are "Study Buddy", a fellow university student in the same year. You are NOT an AI, you are NOT a formal tutor, and you are NOT a customer service bot. You are a real, highly relatable human friend chatting on a messaging app.

CRITICAL HUMAN BEHAVIOR RULES:
1. Be Extremely Curious: Real friends ask questions about YOU. Ask them about their major, why they find a certain topic hard, what their favorite subjects are, or how their classes are going. Get to know them personally!
2. Handle Tangents Naturally: If the student suddenly changes the subject (e.g., you were talking about Image Processing, but they mention they are good at Databases), GO WITH THE FLOW. Do NOT awkwardly force an analogy to drag them back to the old topic. Acknowledge their new thought, validate their strengths, and chat about the new topic for a bit.
3. Empathy Over Efficiency: If they say "I have 0 idea man", don't just immediately start lecturing them. Relate to them. Say something like "Dude, honestly same, that lecture was confusing. Are you a CS major or something else?".
4. Socratic but Casual: When you do explain things, don't dump paragraphs. Explain one tiny piece, then ask a casual checking question like "Does that track?" or "Have you guys covered that part yet?".
5. Conversational Variety: Use filler words naturally ("honestly", "kinda", "tbh", "yeah no", "wait", "oh nice").

Student's Current Profile:
- Weak Topics: ${weak}
- Strong Topics: ${strong}
- Upcoming Exams: ${examsStr}
- Mood right now: ${profile.lastMood}

Pedagogical Strategy:
${emotionalContext}

${ctxPart}
`.trim();
}

function formatBuddyReply(raw) {
  if (!raw) return "Sorry, my brain just glitched. What was that?";
  let text = raw.trim();
  const lines = text.split("\n");
  const keep = [];

  for (const line of lines) {
    if (line.trim()) keep.push(line.trim());
  }

  return keep.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
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

    const profile = await getOrCreateProfile(userId);
    const historyDocs = await ConversationMessage.find({ userId, sessionId }).sort({ createdAt: -1 }).limit(6).lean();
    const history = historyDocs.reverse();

    const observerData = await runShadowObserver(message, history);

    if (observerData.mood) {
        profile.lastMood = observerData.mood;
    }
    if (observerData.motivationLevel) {
        profile.motivationLevel = observerData.motivationLevel;
    }

    if (Array.isArray(observerData.newWeakTopics)) {
        observerData.newWeakTopics.forEach(topic => {
            profile.weakTopics = updateUniqueList(profile.weakTopics, topic);
        });
    } else if (typeof observerData.newWeakTopics === 'string') {
        profile.weakTopics = updateUniqueList(profile.weakTopics, observerData.newWeakTopics);
    }

    if (Array.isArray(observerData.newStrongTopics)) {
        observerData.newStrongTopics.forEach(topic => {
            profile.strongTopics = updateUniqueList(profile.strongTopics, topic);
        });
    } else if (typeof observerData.newStrongTopics === 'string') {
        profile.strongTopics = updateUniqueList(profile.strongTopics, observerData.newStrongTopics);
    }

    if (observerData.exam && observerData.exam.subject && observerData.exam.subject !== "Unknown") {
      profile.upcomingExams = profile.upcomingExams || [];
      const examExists = profile.upcomingExams.some((e) => e.subject.toLowerCase() === observerData.exam.subject.toLowerCase());
      if (!examExists) {
        profile.upcomingExams.unshift({
          subject: observerData.exam.subject,
          note: observerData.exam.date || "Upcoming",
        });
        profile.upcomingExams = profile.upcomingExams.slice(0, 5);
      }
    }

    if (needsCheckIn(profile)) profile.lastCheckInAt = new Date();
    await profile.save();

    await ConversationMessage.create({ userId, sessionId, role: "user", content: message });

    const contextBlocks = await retrieveStudyContext(userId, sessionId, message, 5);
    const contextText = buildContextText(contextBlocks);

    const systemPrompt = buildSystemPrompt(profile, contextText, observerData.intent);
    
    // Send a longer chat history to the LLM so it remembers the flow better
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
      temperature: 0.75, // Pushed to 0.75 so the agent is more creative and human-like
      top_p: 0.95,
    });

    reply = formatBuddyReply(reply);

    await ConversationMessage.create({ userId, sessionId, role: "assistant", content: reply });
    await ChatSession.updateOne({ _id: sessionId, userId }, { lastMessageAt: new Date() });

    return res.json({
      reply,
      mood: profile.lastMood,
      motivationLevel: profile.motivationLevel,
      contextUsed: contextBlocks.length > 0,
      intent: observerData.intent || "chat",
      extractedInsights: {
        newWeakTopics: observerData.newWeakTopics || [],
        newStrongTopics: observerData.newStrongTopics || [],
        exam: observerData.exam || null
      }
    });

  } catch (err) {
    console.error("chatWithBuddy error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// ==========================================
// SESSION SUMMARY
// ==========================================
export async function generateSessionSummary(req, res) {
  try {
    const userId = req.user._id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const historyDocs = await ConversationMessage.find({ userId, sessionId })
      .sort({ createdAt: 1 })
      .lean();

    const transcript = historyDocs
      .filter((msg) => msg.role !== "system")
      .map((msg) => `${msg.role === "user" ? "Student" : "StudyBuddy"}: ${msg.content}`)
      .join("\n\n");

    if (!transcript.trim()) {
      return res.status(400).json({ error: "Not enough chat history to summarize yet." });
    }

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

    const rawSummary = await generateBuddyCompletion({
      messages: [{ role: "system", content: prompt }],
      max_tokens: 500,
      temperature: 0.2, 
      top_p: 0.9,
    });

    if (!rawSummary) {
      throw new Error("LLM returned an empty summary.");
    }

    return res.json({ summary: rawSummary.trim() });

  } catch (err) {
    console.error("generateSessionSummary error:", err);
    return res.status(500).json({ error: "Server error generating summary" });
  }
}

// ==========================================
// KNOWLEDGE GRAPH
// ==========================================
export async function getStudentKnowledge(req, res) {
  try {
    const userId = req.user._id;
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