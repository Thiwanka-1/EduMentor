// api/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; // <-- 1. IMPORT THIS
import connectDB from "./src/config/db.js";
import path from "path";

import authRoutes from "./src/routes/auth.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import explanationRoutes from "./src/routes/explanations.routes.js";
import studyToolsRoutes from "./src/routes/studytools.routes.js";

import buddychatRoutes from "./src/routes/chatRoutes.js";
import docRoutes from "./src/routes/docRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";


import materialRoutes from "./src/routes/materialRoutes.js";
import quizRoutes from "./src/routes/quizRoutes.js";
import adaptiveDashboardRoutes from "./src/routes/adaptiveDashboardRoutes.js";


import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// ==========================================
// MIDDLEWARES (Order is strictly important!)
// ==========================================

// Allow frontend to send cookies securely
app.use(
  cors({
    origin: "http://localhost:5173", // Update this if your Vite port is different!
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser()); // <-- 2. ADD THIS BEFORE YOUR ROUTES

// ==========================================
// ROUTES
// ==========================================

// Test route
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/sessions", sessionRoutes);
app.use("/api/chat", buddychatRoutes);
app.use("/api/docs", docRoutes);

// Auth Routes
app.use("/api/auth", authRoutes);

app.use("/api/mveg", chatRoutes);
app.use("/api/mveg", explanationRoutes);
app.use("/api/mveg", studyToolsRoutes);


app.use("/api/adaptive/material", materialRoutes);
app.use("/api/adaptive/quiz", quizRoutes);
app.use("/api/adaptive/dashboard", adaptiveDashboardRoutes);

// Port
const PORT = process.env.PORT || 5000;

// Connect DB and Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`),
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
