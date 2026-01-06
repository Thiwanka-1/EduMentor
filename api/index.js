// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { connectDB } from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js";
import docRoutes from "./routes/docRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"], // your Vite frontend
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("Study Buddy backend is running ✅");
});

// Serve uploaded PDFs (dev/local storage)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/sessions", sessionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/docs", docRoutes);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
});
