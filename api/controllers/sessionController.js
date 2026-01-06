// api/controllers/sessionController.js
import { ChatSession } from "../models/ChatSession.js";
import { ConversationMessage } from "../models/ConversationMessage.js";
import { DocChunk } from "../models/DocChunk.js";
import { DocFile } from "../models/DocFile.js";

export async function listSessions(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const sessions = await ChatSession.find({ userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    return res.json({ sessions });
  } catch (e) {
    console.error("listSessions error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function createSession(req, res) {
  try {
    const { userId, title } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const session = await ChatSession.create({
      userId,
      title: title?.trim() || "New Chat",
      lastMessageAt: new Date(),
    });

    return res.json({ session });
  } catch (e) {
    console.error("createSession error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function renameSession(req, res) {
  try {
    const { id } = req.params;
    const { userId, title } = req.body;
    if (!userId || !title?.trim())
      return res.status(400).json({ error: "userId and title are required" });

    const session = await ChatSession.findOneAndUpdate(
      { _id: id, userId },
      { title: title.trim() },
      { new: true }
    );

    if (!session) return res.status(404).json({ error: "Session not found" });
    return res.json({ session });
  } catch (e) {
    console.error("renameSession error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function deleteSession(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    await ChatSession.deleteOne({ _id: id, userId });
    await ConversationMessage.deleteMany({ sessionId: id, userId });
    await DocChunk.deleteMany({ sessionId: id, userId });
    await DocFile.deleteMany({ sessionId: id, userId });

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteSession error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function getMessages(req, res) {
  try {
    const { id } = req.params; // sessionId
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const msgs = await ConversationMessage.find({ userId, sessionId: id })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ messages: msgs });
  } catch (e) {
    console.error("getMessages error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
