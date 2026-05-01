// api/src/routes/chatRoutes.js
import express from "express";
import { chatWithBuddy, generateSessionSummary, getStudentKnowledge} from "../controllers/chatController.js";
import { protect } from "../middleware/auth.middleware.js";
import { getPeerMatches, generateJointStudyPlan, getSharedPlans } from "../controllers/peerController.js";
const router = express.Router();

// Because server.js uses app.use("/api/chat", buddychatRoutes)
// The following route resolves to POST /api/chat
router.post("/", protect, chatWithBuddy);
router.post("/summary", protect, generateSessionSummary);
// Add this next to your other chat routes
router.get("/knowledge", protect, getStudentKnowledge);


router.get("/peers/matches", protect, getPeerMatches);
router.get("/peers/study-plans", protect, getSharedPlans); // 👉 New Route
router.post("/peers/study-plan", protect, generateJointStudyPlan);


export default router;