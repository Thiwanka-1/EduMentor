import WeakPoint from '../models/WeakPoint.js';

export const logExternalWeakPoint = async (userId, topic, sourceFunction) => {
  try {
    // 1. Check if this weak point already exists and is unmastered
    const existingWeakPoint = await WeakPoint.findOne({ 
      userId, 
      topic, 
      mastered: false 
    });

    if (existingWeakPoint) {
      // If it exists, just bump up the failure count so we know they are really struggling
      existingWeakPoint.failureCount += 1;
      existingWeakPoint.lastFailedAt = Date.now();
      await existingWeakPoint.save();
      console.log(`[WeakPoint Tracker] Updated existing weak point: ${topic} from ${sourceFunction}`);
    } else {
      // If it doesn't exist, create a brand new one
      await WeakPoint.create({
        userId,
        topic,
        sourceFunction // e.g., 'studybuddy' or 'tutor'
      });
      console.log(`[WeakPoint Tracker] Logged new weak point: ${topic} from ${sourceFunction}`);
    }
  } catch (error) {
    console.error('[WeakPoint Tracker] Failed to log weak point:', error);
  }
};