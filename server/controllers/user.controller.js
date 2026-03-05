// ──────────────────────────────────────────────────────────────
// User / Auth Controller
// Handles registration, login, profile
// ──────────────────────────────────────────────────────────────
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Generate JWT token
 */
function generateToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "edumentor_secret_key_2024",
    { expiresIn: "30d" },
  );
}

/**
 * POST /api/users/register
 * Body: { name, email, password }
 */
async function registerUser(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide name, email, and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    const user = await User.create({ name, email, password });

    console.log(`  ✅ New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        streak: user.streak,
      },
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/login
 * Body: { email, password }
 */
async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and password",
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Update lastActive
    user.lastActiveAt = new Date();
    await user.save();

    console.log(`  ✅ User logged in: ${user.email}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        streak: user.streak,
      },
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/profile
 * Protected — requires auth
 */
async function getProfile(req, res) {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      streak: req.user.streak,
      lastActiveAt: req.user.lastActiveAt,
      createdAt: req.user.createdAt,
    },
  });
}

/**
 * PUT /api/users/profile
 * Protected — update name, email
 */
async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        streak: user.streak,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerUser, loginUser, getProfile, updateProfile };
