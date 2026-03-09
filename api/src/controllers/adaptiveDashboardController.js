import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';
import WeakPoint from '../models/WeakPoint.js';

// 1. Get High-Level Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalMaterials = await Material.countDocuments({ userId });
    const totalQuizzes = await Quiz.countDocuments({ userId });
    
    // Calculate mastery based on weak points
    const activeWeakPoints = await WeakPoint.countDocuments({ userId, mastered: false });
    const masteredTopics = await WeakPoint.countDocuments({ userId, mastered: true });
    
    let masteryPercentage = 0;
    if ((activeWeakPoints + masteredTopics) > 0) {
      masteryPercentage = Math.round((masteredTopics / (activeWeakPoints + masteredTopics)) * 100);
    }

    res.status(200).json({
      filesProcessed: totalMaterials,
      quizzesTaken: totalQuizzes,
      activeWeakPoints,
      masteryPercentage
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// 2. Get User's Uploaded Materials (For "Recent Files")
export const getUserMaterials = async (req, res) => {
  try {
    // Exclude the heavy extractedText field so the API responds instantly
    const materials = await Material.find({ userId: req.user._id })
                                    .select('-extractedText')
                                    .sort({ uploadDate: -1 });
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch materials' });
  }
};

// 3. Get User's Quiz History
export const getUserQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user._id })
                              .populate('sourceMaterialId', 'fileName') // Pulls the file name if it exists
                              .sort({ createdAt: -1 });
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quiz history' });
  }
};

// 4. Get User's Active Weak Points
export const getUserWeakPoints = async (req, res) => {
  try {
    const weakPoints = await WeakPoint.find({ userId: req.user._id, mastered: false })
                                      .sort({ failureCount: -1 }); // Show most failed first
    res.status(200).json(weakPoints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch weak points' });
  }
};