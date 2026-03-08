import dotenv from "dotenv";
import mongoose from "mongoose";

// Load models
import User from "../models/user.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import TopicProgress from "../models/topicProgress.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const TEST_USER = {
  name: "Sachith",
  email: "sachith@test.com",
  password: "password123", // will be hashed by the User model pre-save hook
  role: "student",
};

async function seed() {
  try {
    console.log(" Connecting to MongoDB Atlas…");
    await mongoose.connect(MONGO_URI);
    console.log("   Connected.\n");

    // 1. Create or update the User account (for login)
    let user = await User.findOne({ email: TEST_USER.email });

    if (user) {
      console.log(
        `    User "${TEST_USER.email}" already exists (id: ${user._id}).`,
      );
      console.log("     Skipping user creation.\n");
    } else {
      user = await User.create(TEST_USER);
      console.log(`   User created: ${user.email} (id: ${user._id})\n`);
    }

    const userId = user._id.toString();

    // 2. Seed StudentProfile (linked to the real user)
    const existing = await StudentProfile.findOne({ userId });

    if (existing) {
      console.log(`    StudentProfile for "${userId}" already exists.`);
      console.log("     Updating weakTopics…\n");

      existing.weakTopics = [
        "Entropy Increase",
        "Heat Flow Direction",
        "Isolated Systems",
      ];
      existing.strongTopics = [];
      existing.displayName = TEST_USER.name;
      await existing.save();
    } else {
      await StudentProfile.create({
        userId,
        displayName: TEST_USER.name,
        weakTopics: [
          "Entropy Increase",
          "Heat Flow Direction",
          "Isolated Systems",
        ],
        strongTopics: [],
      });
      console.log("   StudentProfile created.\n");
    }

    // 3. Reset & seed TopicProgress for this user
    await TopicProgress.deleteMany({ userId });
    console.log("    Cleared old TopicProgress records.");

    const topics = [
      {
        topic: "Entropy Increase",
        masteryScore: 45,
        difficulty: "easy",
        attempts: 2,
      },
      {
        topic: "Heat Flow Direction",
        masteryScore: 30,
        difficulty: "easy",
        attempts: 1,
      },
      {
        topic: "Isolated Systems",
        masteryScore: 10,
        difficulty: "easy",
        attempts: 0,
      },
    ];

    for (const t of topics) {
      await TopicProgress.create({
        userId,
        ...t,
        completed: false,
      });
    }

    console.log(`   Inserted ${topics.length} TopicProgress records.\n`);

    // 4. Print summary
    console.log("   SEED SUMMARY");
    console.log(`  Login Email    : ${TEST_USER.email}`);
    console.log(`  Login Password : ${TEST_USER.password}`);
    console.log(`  User ID        : ${userId}`);
    console.log(`  Display Name   : ${TEST_USER.name}`);
    console.log("");

    const profile = await StudentProfile.findOne({ userId }).lean();
    console.log("   StudentProfile:");
    console.log(`     weakTopics   : ${profile.weakTopics.join(", ")}`);
    console.log(
      `     strongTopics : ${profile.strongTopics.length ? profile.strongTopics.join(", ") : "(none)"}`,
    );
    console.log("");

    const progress = await TopicProgress.find({ userId }).lean();
    console.log("   TopicProgress:");
    for (const p of progress) {
      console.log(
        `     • ${p.topic}  — mastery: ${p.masteryScore}%, difficulty: ${p.difficulty}, attempts: ${p.attempts}`,
      );
    }

    console.log("\n Seed complete! You can now log in with:");
    console.log(`   Email    : ${TEST_USER.email}`);
    console.log(`   Password : ${TEST_USER.password}\n`);

    process.exit(0);
  } catch (err) {
    console.error(" Seed failed:", err.message);
    process.exit(1);
  }
}

seed();