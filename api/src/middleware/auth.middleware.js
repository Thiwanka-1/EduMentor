import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Protect routes — requires valid JWT token.
 * Sets req.user with the authenticated user document.
 */
export async function protect(req, res, next) {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized — no token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "edumentor_secret_key_2024"
    );
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Not authorized — user not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({
      success: false,
      error: "Not authorized — invalid token",
    });
  }
}

/**
 * Optional auth — attaches user if token present, but doesn't block.
 */
export async function optionalAuth(req, _res, next) {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "edumentor_secret_key_2024"
      );
      req.user = await User.findById(decoded.id);
    }
  } catch (_) {
    // Silently continue without user
  }
  next();
}