// api/controllers/peerController.js
import "../config/env.js";
import { StudentProfile } from "../models/StudentProfile.js";
import User from "../models/User.js";
import { generateBuddyCompletion } from "../config/llmClient.js";
import { JointPlan } from "../models/JointPlan.js";
import { DirectMessage } from "../models/DirectMessage.js";

// ==========================================
// SEMANTIC MATCHING DICTIONARY
// ==========================================
const TOPIC_SYNONYMS = {
  "oop": "object oriented programming",
  "db": "databases",
  "dbms": "databases",
  "sql": "databases",
  "os": "operating systems",
  "ui": "user interfaces",
  "ux": "user experience",
  "ml": "machine learning",
  "ai": "artificial intelligence",
  "algo": "algorithms",
  "ds": "data structures"
};

function normalizeTopic(topic) {
  if (!topic) return "";
  let clean = String(topic).toLowerCase().trim();
  return TOPIC_SYNONYMS[clean] || clean;
}

// Crash protection for empty database arrays (Genuine fix)
function findSemanticMatches(arrayA, arrayB) {
  if (!arrayA || !Array.isArray(arrayA) || !arrayB || !Array.isArray(arrayB)) {
    return []; 
  }
  const normalizedA = arrayA.map(normalizeTopic);
  const normalizedB = arrayB.map(normalizeTopic);
  return arrayA.filter((originalTopic, index) => 
    normalizedB.includes(normalizedA[index])
  );
}

// ==========================================
// 1. THE GENUINE PEER MATCHING ALGORITHM
// ==========================================
export async function getPeerMatches(req, res) {
  try {
    const currentUserId = req.user._id.toString();
    const myProfile = await StudentProfile.findOne({ userId: currentUserId });

    if (!myProfile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    const allProfiles = await StudentProfile.find({ userId: { $ne: currentUserId } });
    
    const userIds = allProfiles.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds } });
    const userMap = users.reduce((acc, u) => {
      acc[u._id.toString()] = { name: u.name, email: u.email };
      return acc;
    }, {});

    const matches = [];

    for (const peer of allProfiles) {
      const peerData = userMap[peer.userId];
      if (!peerData) continue; 

      // The core math: finding the actual intersections
      const theyCanTeachMe = findSemanticMatches(myProfile.weakTopics, peer.strongTopics);
      const iCanTeachThem = findSemanticMatches(myProfile.strongTopics, peer.weakTopics);

      let score = 0;
      let matchType = "None";

      if (theyCanTeachMe.length > 0 && iCanTeachThem.length > 0) {
        score += 80; 
        matchType = "Mutual Exchange";
      } else if (theyCanTeachMe.length > 0) {
        score += 50; 
        matchType = "Find a Tutor";
      } else if (iCanTeachThem.length > 0) {
        score += 50;
        matchType = "Be a Mentor";
      }

      // Safe motivation calculation fallback
      const myMotivation = myProfile.motivationLevel || 3;
      const peerMotivation = peer.motivationLevel || 3;
      const motivationDiff = Math.abs(myMotivation - peerMotivation);
      
      if (motivationDiff >= 2 && score > 0) {
        score += 15; 
      }

      // Only pushes to the array if a GENUINE match > 0 exists
      if (score > 0) {
        matches.push({
          peerId: peer.userId,
          name: peerData.name,
          email: peerData.email,
          compatibilityScore: Math.min(100, score), 
          matchType,
          topicsToLearn: theyCanTeachMe,
          topicsToTeach: iCanTeachThem,
          peerMotivation: peer.motivationLevel
        });
      }
    }

    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    return res.json({ matches });
  } catch (err) {
    console.error("getPeerMatches error:", err);
    return res.status(500).json({ error: "Failed to generate peer matches" });
  }
}

export async function getSharedPlans(req, res) {
  try {
    const currentUserId = req.user._id.toString();
    const plans = await JointPlan.find({
      $or: [{ tutorId: currentUserId }, { learnerId: currentUserId }]
    });
    return res.json({ plans });
  } catch (err) {
    console.error("getSharedPlans error:", err);
    return res.status(500).json({ error: "Failed to fetch shared plans" });
  }
}

// ==========================================
// 2. THE JOINT STUDY PLAN GENERATOR
// ==========================================
export async function generateJointStudyPlan(req, res) {
  try {
    const currentUserId = req.user._id.toString();
    const { peerId, topicToTeach } = req.body;

    if (!peerId || !topicToTeach) {
      return res.status(400).json({ error: "peerId and topicToTeach are required." });
    }

    const existingPlan = await JointPlan.findOne({ 
      tutorId: currentUserId, 
      learnerId: peerId, 
      topic: topicToTeach 
    });
    
    if (existingPlan) {
      return res.json({ studyPlan: existingPlan.content, planId: existingPlan._id });
    }

    const me = await User.findById(currentUserId);
    const peer = await User.findById(peerId);

    const prompt = `
You are an elite academic curriculum designer for a university.
Design a highly detailed, premium-quality 1-hour tutoring lesson plan where ${me.name} (the Expert Mentor) teaches ${peer.name} (the Learner) about the specific topic: "${topicToTeach}".

Do NOT output generic bullet points. Create a rich, educational masterclass structured EXACTLY as follows:

### 🎯 Session Objective
(Briefly state what ${peer.name} will achieve in this hour)

### 🧊 1. The Icebreaker Analogy (5 mins)
(Provide a brilliant, real-world analogy to explain the core concept of ${topicToTeach} to a beginner. Make it highly relatable.)

### 🧠 2. Core Concepts Deep Dive (25 mins)
(Break down the technical details into 3 distinct, highly detailed steps. Include specific definitions and examples ${me.name} should say out loud.)

### ⚠️ 3. Common Pitfalls (10 mins)
(List 2 common mistakes or misconceptions students usually have about this topic, and exactly how ${me.name} can help ${peer.name} avoid them.)

### 💻 4. Collaborative Exercise (15 mins)
(Design a specific, actionable practice problem, whiteboard scenario, or challenge they must solve together right now to prove understanding.)

### ❓ 5. Verification Quiz (5 mins)
(Provide 3 challenging quiz questions to test ${peer.name}'s understanding, along with the correct answers for the mentor to grade them.)
    `.trim();

    const rawPlan = await generateBuddyCompletion({
      messages: [{ role: "system", content: prompt }],
      max_tokens: 1500, 
      temperature: 0.4,
    });

    const finalContent = rawPlan.trim();

    const savedPlan = await JointPlan.create({
      tutorId: currentUserId,
      learnerId: peerId,
      topic: topicToTeach,
      content: finalContent
    });

    return res.json({ studyPlan: finalContent, planId: savedPlan._id });
  } catch (err) {
    console.error("generateJointStudyPlan error:", err);
    return res.status(500).json({ error: "Failed to generate study plan" });
  }
}

// ==========================================
// 3. PEER-TO-PEER MESSAGING
// ==========================================
export async function sendDirectMessage(req, res) {
  try {
    const senderId = req.user._id.toString();
    const { receiverId, text } = req.body;

    if (!receiverId || !text.trim()) {
      return res.status(400).json({ error: "Receiver and text are required." });
    }

    const msg = await DirectMessage.create({ senderId, receiverId, text: text.trim() });
    return res.json({ message: msg });
  } catch (err) {
    console.error("sendDirectMessage error:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
}

export async function getDirectMessages(req, res) {
  try {
    const myId = req.user._id.toString();
    const peerId = req.params.peerId;

    const messages = await DirectMessage.find({
      $or: [
        { senderId: myId, receiverId: peerId },
        { senderId: peerId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 }); 

    return res.json({ messages });
  } catch (err) {
    console.error("getDirectMessages error:", err);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
}