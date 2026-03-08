import express from "express";
import { registerUser, loginUser, getProfile, updateProfile } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;