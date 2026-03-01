import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";

import chatRoutes from "./src/routes/chat.routes.js";
import explanationRoutes from "./src/routes/explanations.routes.js";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// API Routes
app.use("/api", chatRoutes);
app.use("/api", explanationRoutes);

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
