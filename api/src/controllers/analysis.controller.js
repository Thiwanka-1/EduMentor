// Analysis Controller — Progress Analysis page data
const Attempt = require("../models/attempt.model");
const TopicProgress = require("../models/topicProgress.model");
const StudentProfile = require("../models/studentProfile.model");

/**
 * GET /api/analysis/progress
 * Returns full progress analysis data for the logged-in user.
 *
 * Response:
 * {
 *   masteryScore,         // average mastery across all topics
 *   totalQuestions,       // total questions ever answered
 *   streak,               // consecutive days of activity
 *   performanceTrend,     // weekly accuracy data for chart
 *   criticalWeakPoints,   // topics with masteryScore < 60
 *   topicMastery,         // all topics with mastery percentages
 *   recommendation        // recommended action (top 2 weak topics)
 * }
 */
async function getProgressAnalysis(req, res, next) {
  try {
    const userId = req.user._id.toString();
    const userObjectId = req.user._id;

    const masteryAgg = await TopicProgress.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avgMastery: { $avg: "$masteryScore" } } },
    ]);
    const masteryScore =
      masteryAgg.length > 0 ? Math.round(masteryAgg[0].avgMastery) : 0;

    const questionsAgg = await Attempt.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$totalQuestions" } } },
    ]);
    const totalQuestions = questionsAgg.length > 0 ? questionsAgg[0].total : 0;

    // Calculate streak from consecutive days with at least one attempt
    const streak = await calculateStreak(userObjectId);

    // Get attempts from the last 4 weeks, grouped by week
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyPerformance = await Attempt.aggregate([
      {
        $match: {
          userId: userObjectId,
          submittedAt: { $gte: fourWeeksAgo },
        },
      },
      {
        $group: {
          _id: { $isoWeek: "$submittedAt" },
          weekStart: { $min: "$submittedAt" },
          totalCorrect: { $sum: "$correctCount" },
          totalQuestions: { $sum: "$totalQuestions" },
          attempts: { $sum: 1 },
        },
      },
      { $sort: { weekStart: 1 } },
    ]);

    const performanceTrend = weeklyPerformance.map((w, i) => ({
      label: `Week ${i + 1}`,
      weekNumber: w._id,
      accuracy:
        w.totalQuestions > 0
          ? Math.round((w.totalCorrect / w.totalQuestions) * 100)
          : 0,
      totalQuestions: w.totalQuestions,
      totalCorrect: w.totalCorrect,
      attempts: w.attempts,
    }));

    // Calculate improvement percentage
    let improvement = 0;
    if (performanceTrend.length >= 2) {
      const first = performanceTrend[0].accuracy;
      const last = performanceTrend[performanceTrend.length - 1].accuracy;
      improvement = last - first;
    }

    const criticalWeakPoints = await TopicProgress.find({
      userId,
      masteryScore: { $lt: 60 },
    })
      .sort({ masteryScore: 1 })
      .lean();

    const criticalTopics = criticalWeakPoints.map((p) => ({
      topic: p.topic,
      masteryScore: p.masteryScore,
      difficulty: p.difficulty,
      attempts: p.attempts,
    }));

    const allTopics = await TopicProgress.find({ userId })
      .sort({ masteryScore: -1 })
      .lean();

    const topicMastery = allTopics.map((p) => ({
      topic: p.topic,
      masteryScore: p.masteryScore,
      difficulty: p.difficulty,
      attempts: p.attempts,
      completed: p.completed,
    }));

    // Select top 2 weakest topics for a reinforcement session
    const weakest = criticalTopics.slice(0, 2);
    const recommendation = {
      topics: weakest.map((w) => w.topic),
      recommendedQuestions: 20,
      description:
        weakest.length > 0
          ? `We've generated a targeted session with 20 questions focusing on ${weakest.map((w) => w.topic).join(" and ")}.`
          : "Great work! No critical weak points detected.",
    };

    res.json({
      success: true,
      masteryScore,
      totalQuestions,
      streak,
      performanceTrend,
      improvement,
      criticalWeakPoints: criticalTopics,
      topicMastery,
      recommendation,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Calculate the number of consecutive days (ending today)
 * on which the user submitted at least one attempt.
 */
async function calculateStreak(userObjectId) {
  // Get distinct dates (as day strings) of attempts, sorted descending
  const attempts = await Attempt.find({ userId: userObjectId })
    .select("submittedAt")
    .sort({ submittedAt: -1 })
    .lean();

  if (attempts.length === 0) return 0;

  // Build a set of unique date strings (YYYY-MM-DD)
  const dateSet = new Set();
  attempts.forEach((a) => {
    const d = new Date(a.submittedAt);
    dateSet.add(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      );
  });

  // Walk backwards from today
  let streak = 0;
  const current = new Date();

  // Check today first — if no activity today, check yesterday as start
  const todayStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
  if (!dateSet.has(todayStr)) {
    // Check if they were active yesterday
    current.setDate(current.getDate() - 1);
    const yesterdayStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    if (!dateSet.has(yesterdayStr)) {
      return 0;
    }
  }

  // Count consecutive days
  const walker = new Date(current);
  for (let i = 0; i < 365; i++) {
    const ds = `${walker.getFullYear()}-${String(walker.getMonth() + 1).padStart(2, "0")}-${String(walker.getDate()).padStart(2, "0")}`;
    if (dateSet.has(ds)) {
      streak++;
      walker.setDate(walker.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

module.exports = { getProgressAnalysis };
