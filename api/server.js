// api/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; // <-- 1. IMPORT THIS
import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/auth.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import explanationRoutes from "./src/routes/explanations.routes.js";
import studyToolsRoutes from "./src/routes/studytools.routes.js";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// ==========================================
// MIDDLEWARES (Order is strictly important!)
// ==========================================

// Allow frontend to send cookies securely
app.use(cors({
  origin: "http://localhost:5173", // Update this if your Vite port is different!
  credentials: true 
}));

app.use(express.json());
app.use(cookieParser()); // <-- 2. ADD THIS BEFORE YOUR ROUTES

// ==========================================
// ROUTES
// ==========================================

// Test route
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// Auth & Engine Routes
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api", explanationRoutes);
app.use("/api", studyToolsRoutes);

// Port
const PORT = process.env.PORT || 5000;

// Connect DB and Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });