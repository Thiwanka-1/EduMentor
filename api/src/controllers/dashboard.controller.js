import Material from "../models/material.model.js";
import Attempt from "../models/attempt.model.js";
import TopicProgress from "../models/topicProgress.model.js";
import StudentProfile from "../models/studentProfile.model.js";

/**
 * GET /api/dashboard/summary
 * Returns aggregated stats for the logged-in user's dashboard.
 *
 * Response:
 * {
 *   masteryScore,      // average mastery across all user topics
 *   questionsToday,    // count of questions answered today
 *   filesProcessed,    // count of materials uploaded by the user
 *   recentFiles,       // last 5 uploaded materials
 *   weakTopics         // weak topics with mastery percentages
 * }
 */
export async function getDashboardSummary(req, res, next) {
  try {
    const userId = req.user._id.toString();
    const userObjectId = req.user._id;

    // Average masteryScore across all topics for the user
    const masteryAgg = await TopicProgress.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avgMastery: { $avg: "$masteryScore" } } },
    ]);
    const masteryScore =
      masteryAgg.length > 0 ? Math.round(masteryAgg[0].avgMastery) : 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayAttempts = await Attempt.aggregate([
      {
        $match: {
          userId: userObjectId,
          submittedAt: { $gte: startOfToday },
        },
      },
      { $group: { _id: null, totalQuestions: { $sum: "$totalQuestions" } } },
    ]);
    const questionsToday =
      todayAttempts.length > 0 ? todayAttempts[0].totalQuestions : 0;

    const filesProcessed = await Material.countDocuments({
      userId: userObjectId,
    });

    const recentMaterials = await Material.find({ userId: userObjectId })
      .select("title files uploadedAt")
      .sort({ uploadedAt: -1 })
      .limit(5)
      .lean();

    const recentFiles = recentMaterials.map((m) => ({
      id: m._id,
      filename: m.files?.[0]?.originalname || m.title || "Untitled",
      title: m.title,
      uploadedAt: m.uploadedAt,
    }));

    // Get weak topics from StudentProfile, then fetch mastery from TopicProgress
    const profile = await StudentProfile.findOne({ userId }).lean();
    const weakTopicNames = profile?.weakTopics || [];

    let weakTopics = [];
    if (weakTopicNames.length > 0) {
      const progressRecords = await TopicProgress.find({
        userId,
        topic: { $in: weakTopicNames },
      }).lean();

      const progressMap = {};
      progressRecords.forEach((p) => {
        progressMap[p.topic] = p.masteryScore;
      });

      weakTopics = weakTopicNames.map((topic) => ({
        topic,
        masteryScore: progressMap[topic] ?? 0,
      }));
    }

    const streak = req.user.streak || 0;

    res.json({
      success: true,
      masteryScore,
      questionsToday,
      filesProcessed,
      recentFiles,
      weakTopics,
      streak,
    });
  } catch (err) {
    next(err);
  }
}