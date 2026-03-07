// api/src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  // Read the token directly from the cookies!
  let token = req.cookies.token;

  if (token) {
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from the database and attach to req
      req.user = await User.findById(decoded.id).select("-password");

      next(); // Move on to the actual controller logic
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed or expired" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token provided" });
  }
};