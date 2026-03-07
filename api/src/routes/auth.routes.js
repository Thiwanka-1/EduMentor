// api/src/routes/auth.routes.js
import express from "express";
import { 
  signup, 
  login, 
  logout, 
  getUserProfile, 
  updateUserProfile, 
  getAllUsers, 
  getUserById, 
  deleteUser 
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public Authentication Routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Protected Profile Routes (For the logged-in user)
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Protected General CRUD Routes (You might want to restrict these later)
router.get("/users", protect, getAllUsers);
router.get("/users/:id", protect, getUserById);
router.delete("/users/:id", protect, deleteUser);

export default router;