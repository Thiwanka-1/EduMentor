import LessonSession from "../models/LessonSession.js";
import {
  buildNotesFromMessages,
  generateSessionTitle,
  generateTutorReply,
} from "../services/tutorService.js";

const SUPPORTED_LANGUAGE_MODES = ["english", "sinhala", "singlish", "tamil"];

function getUserId(req) {
  return req.user?.id || req.user?._id;
}

function getUserDisplayName(req) {
  const user = req.user || req.authUser || {};

  const rawName =
    user.name ||
    user.fullName ||
    user.firstName ||
    user.username ||
    user.email?.split("@")?.[0] ||
    "there";

  return String(rawName || "there").trim() || "there";
}

function normalizeLanguageMode(languageMode) {
  const mode = String(languageMode || "english").toLowerCase().trim();
  return SUPPORTED_LANGUAGE_MODES.includes(mode) ? mode : "english";
}

function normalizeClientMessages(clientMessages = [], languageMode = "english") {
  if (!Array.isArray(clientMessages)) return [];

  const selectedLanguageMode = normalizeLanguageMode(languageMode);

  return clientMessages
    .map((m) => {
      const role =
        m.role === "tutor" || m.role === "assistant" || m.sender === "ai"
          ? "tutor"
          : "user";

      const text = String(m.text || "").trim();

      if (!text) return null;

      return {
        role,
        text,
        messageType: "text",
        languageMode: m.languageMode || selectedLanguageMode,
        timestamp: new Date(),
      };
    })
    .filter(Boolean)
    .slice(-10);
}

function buildPromptHistory(sessionMessages = [], clientMessages = []) {
  /*
    We put session messages first, then client-visible messages.
    This lets the latest frontend/WebSocket explanation be included
    when the user says short follow-ups like "more", "explain more", etc.
  */
  const combined = [...sessionMessages, ...clientMessages];
  const seen = new Set();

  return combined
    .filter((m) => {
      const role = String(m.role || "").trim();
      const text = String(m.text || "").trim();

      if (!text) return false;

      const key = `${role}:${text}`;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .slice(-14);
}

function getLanguageFallbackReply(languageMode) {
  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") {
    return "සමාවෙන්න, මේ වෙලාවේ පිළිතුරක් සකස් කරන්න බැරි වුණා. කරුණාකර නැවත උත්සාහ කරන්න.";
  }

  if (mode === "singlish") {
    return "Sorry, me welawe answer eka hadanna bari una. Karunakara aye try karanna.";
  }

  if (mode === "tamil") {
    return "மன்னிக்கவும், இப்போது பதிலை உருவாக்க முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சி செய்யுங்கள்.";
  }

  return "Sorry, I could not generate a reply right now. Please try again.";
}

function getMotivationText(languageMode) {
  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") {
    return "හොඳයි, අපි මේක ටික ටික ලේසි කරගමු.";
  }

  if (mode === "singlish") {
    return "Hari, api meka tika tika lesi karagamu. Oyata puluwan.";
  }

  if (mode === "tamil") {
    return "சரி, இதை நாம மெதுவாக எளிதாகப் புரிந்துகொள்வோம். உங்களால் முடியும்.";
  }

  return "You’re doing well. Let’s go one step at a time.";
}

function shouldAddMotivation(message = "") {
  const text = String(message || "").toLowerCase();

  return (
    text.includes("confused") ||
    text.includes("hard") ||
    text.includes("difficult") ||
    text.includes("don't understand") ||
    text.includes("dont understand") ||
    text.includes("not understand") ||
    text.includes("amaru") ||
    text.includes("therrenne") ||
    text.includes("therenne") ||
    text.includes("තේරෙන්නේ") ||
    text.includes("අමාරු") ||
    text.includes("புரியவில்லை") ||
    text.includes("கஷ்டம்")
  );
}

export async function chatLesson(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const {
      sessionId = "",
      topic = "",
      message = "",
      docId = "",
      sourceType = "text",
      languageMode,
      clientMessages = [],
    } = req.body;

    const cleanMessage = String(message || "").trim();
    const cleanTopic = String(topic || "").trim();
    const cleanDocId = String(docId || "").trim();
    const cleanSourceType = String(sourceType || "text").trim();
    const userName = getUserDisplayName(req);

    if (!sessionId && !cleanTopic && !cleanMessage && !cleanDocId) {
      return res.status(400).json({
        ok: false,
        message: "A topic, message, or document is required to start a lesson.",
      });
    }

    let session;

    if (sessionId) {
      session = await LessonSession.findOne({ _id: sessionId, userId });

      if (!session) {
        return res.status(404).json({
          ok: false,
          message: "Lesson session not found.",
        });
      }

      session.languageMode = normalizeLanguageMode(
        languageMode || session.languageMode || "english"
      );
    } else {
      const selectedLanguageMode = normalizeLanguageMode(
        languageMode || "english"
      );

      const derivedTopic = cleanTopic || cleanMessage || "New Lesson Topic";

      session = await LessonSession.create({
        userId,
        title: generateSessionTitle(derivedTopic),
        topic: derivedTopic,
        languageMode: selectedLanguageMode,
        docId: cleanDocId || "",
        sourceType: cleanSourceType,
        lessonStarted: false,
        messages: [],
        quizHistory: [],
        notesText: "",
        summaryText: "",
        audioUrl: "",
        videoUrl: "",
        lastActivityAt: new Date(),
      });
    }

    const selectedLanguageMode = normalizeLanguageMode(session.languageMode);

    if (cleanDocId && !session.docId) {
      session.docId = cleanDocId;
    }

    if (cleanTopic && !session.topic) {
      session.topic = cleanTopic;
      session.title = generateSessionTitle(cleanTopic);
    }

    if (cleanMessage) {
      session.messages.push({
        role: "user",
        text: cleanMessage,
        messageType: cleanSourceType === "voice" ? "voice" : "text",
        languageMode: selectedLanguageMode,
        timestamp: new Date(),
      });
    } else if (cleanDocId && !session.lessonStarted) {
      session.messages.push({
        role: "system",
        text: "Student uploaded a lesson document and started a lesson session.",
        messageType: "file",
        languageMode: selectedLanguageMode,
        timestamp: new Date(),
      });
    }

    const isFirstLesson = !session.lessonStarted;

    const normalizedClientMessages = normalizeClientMessages(
      clientMessages,
      selectedLanguageMode
    );

    const promptHistory = buildPromptHistory(
      session.messages,
      normalizedClientMessages
    );

    let tutorReply = "";

    try {
      tutorReply = await generateTutorReply({
        topic: session.topic,
        message:
          cleanMessage ||
          `Teach me the uploaded document topic: ${session.topic}`,
        history: promptHistory,
        isFirstLesson,
        languageMode: selectedLanguageMode,
        hasDocument: Boolean(session.docId),
        userName,
      });
    } catch (aiError) {
      console.error("generateTutorReply error:", aiError);
      tutorReply = getLanguageFallbackReply(selectedLanguageMode);
    }

    if (cleanMessage && shouldAddMotivation(cleanMessage)) {
      tutorReply = `${getMotivationText(selectedLanguageMode)}\n\n${tutorReply}`;
    }

    session.messages.push({
      role: "tutor",
      text: tutorReply,
      messageType: isFirstLesson ? "lesson" : "text",
      languageMode: selectedLanguageMode,
      timestamp: new Date(),
    });

    session.languageMode = selectedLanguageMode;
    session.lessonStarted = true;
    session.notesText = buildNotesFromMessages(session.messages);
    session.summaryText =
      session.notesText.length > 500
        ? `${session.notesText.slice(0, 497)}...`
        : session.notesText;
    session.lastActivityAt = new Date();

    await session.save();

    return res.json({
      ok: true,
      sessionId: session._id,
      topic: session.topic,
      languageMode: selectedLanguageMode,
      reply: tutorReply,
      notesText: session.notesText,
      session,
    });
  } catch (err) {
    console.error("chatLesson error:", err);

    return res.status(500).json({
      ok: false,
      message: "Failed to process lesson chat.",
      error: err.message,
    });
  }
}

export async function getLessonSessions(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const sessions = await LessonSession.find({ userId })
      .select(
        "_id title topic languageMode createdAt updatedAt audioUrl videoUrl lastActivityAt docId summaryText lessonStarted"
      )
      .sort({ updatedAt: -1 });

    return res.json({
      ok: true,
      sessions,
    });
  } catch (err) {
    console.error("getLessonSessions error:", err);

    return res.status(500).json({
      ok: false,
      message: "Failed to load lesson sessions.",
      error: err.message,
    });
  }
}

export async function getLessonSessionById(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const session = await LessonSession.findOne({ _id: id, userId });

    if (!session) {
      return res.status(404).json({
        ok: false,
        message: "Lesson session not found.",
      });
    }

    return res.json({
      ok: true,
      session,
    });
  } catch (err) {
    console.error("getLessonSessionById error:", err);

    return res.status(500).json({
      ok: false,
      message: "Failed to load lesson session.",
      error: err.message,
    });
  }
}

export async function updateLessonNotes(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { notesText = "" } = req.body;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const session = await LessonSession.findOne({ _id: id, userId });

    if (!session) {
      return res.status(404).json({
        ok: false,
        message: "Lesson session not found.",
      });
    }

    session.notesText = String(notesText || "");
    session.summaryText =
      session.notesText.length > 500
        ? `${session.notesText.slice(0, 497)}...`
        : session.notesText;
    session.lastActivityAt = new Date();

    await session.save();

    return res.json({
      ok: true,
      session,
    });
  } catch (err) {
    console.error("updateLessonNotes error:", err);

    return res.status(500).json({
      ok: false,
      message: "Failed to update notes.",
      error: err.message,
    });
  }
}

export async function updateLessonMedia(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { audioUrl = "", videoUrl = "" } = req.body;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const session = await LessonSession.findOne({ _id: id, userId });

    if (!session) {
      return res.status(404).json({
        ok: false,
        message: "Lesson session not found.",
      });
    }

    if (audioUrl) session.audioUrl = audioUrl;
    if (videoUrl) session.videoUrl = videoUrl;

    session.lastActivityAt = new Date();

    await session.save();

    return res.json({
      ok: true,
      session,
    });
  } catch (err) {
    console.error("updateLessonMedia error:", err);

    return res.status(500).json({
      ok: false,
      message: "Failed to update media references.",
      error: err.message,
    });
  }
}

export async function deleteLessonSession(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const session = await LessonSession.findOneAndDelete({ _id: id, userId });

    if (!session) {
      return res.status(404).json({
        ok: false,
        message: "Lesson session not found.",
      });
    }

    return res.json({
      ok: true,
      message: "Lesson session deleted successfully.",
      deletedId: id,
    });
  } catch (err) {
    console.error("deleteLessonSession error:", err);

    return res.status(500).json({
      ok: false,
      message: "Failed to delete lesson session.",
      error: err.message,
    });
  }
}