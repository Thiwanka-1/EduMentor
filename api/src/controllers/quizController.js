import Quiz from '../models/Quiz.js';
import Material from '../models/Material.js';
import { generateAIQuiz, generateQuizFromTopics } from '../utils/huggingface.js';
import WeakPoint from '../models/WeakPoint.js';

export const generateQuizFromMaterial = async (req, res) => {
  try {
    const { materialId, quantity, difficulty, type } = req.body;

    // 1. Validate constraints from your UI requirements
    if (quantity < 5 || quantity > 25) {
      return res.status(400).json({ message: 'Quantity must be between 5 and 25' });
    }

    // 2. Fetch the text we parsed in Phase 4
    const material = await Material.findOne({ _id: materialId, userId: req.user._id });
    if (!material) {
      return res.status(404).json({ message: 'Source material not found or unauthorized' });
    }

    // 3. Generate the questions via Hugging Face
    const generatedQuestions = await generateAIQuiz(material.extractedText, {
      quantity,
      difficulty,
      type
    });

    // 4. Save the new quiz to the database
    const newQuiz = new Quiz({
      userId: req.user._id,
      sourceMaterialId: material._id,
      difficulty,
      questions: generatedQuestions
    });

    await newQuiz.save();

    res.status(201).json({
      message: 'Quiz generated successfully',
      quiz: newQuiz
    });

  } catch (error) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate quiz', error: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; 
    // Expected format from frontend: answers = [{ questionId: '...', selectedAnswer: '...' }]

    const quiz = await Quiz.findOne({ _id: quizId, userId: req.user._id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const evaluationResults = [];

    // Loop through each question in the quiz
    for (const question of quiz.questions) {
      // Find the user's answer for this specific question
      const userAnswerObj = answers.find(a => a.questionId === question._id.toString());
      const isCorrect = userAnswerObj && userAnswerObj.selectedAnswer === question.correctAnswer;

      evaluationResults.push({
        questionId: question._id,
        isCorrect: isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });

      if (isCorrect) {
        correctCount++;
        // ADAPTIVE LOGIC: If they got it right, check if it was a weak point and mark it mastered!
        if (question.topicTag) {
          await WeakPoint.findOneAndUpdate(
            { userId: req.user._id, topic: question.topicTag, mastered: false },
            { $set: { mastered: true } }
          );
        }
      } else {
        // ADAPTIVE LOGIC: They got it wrong. Log or update the weak point.
        if (question.topicTag) {
          const existingWeakPoint = await WeakPoint.findOne({ 
            userId: req.user._id, 
            topic: question.topicTag, 
            mastered: false 
          });

          if (existingWeakPoint) {
            // Increment failure count if they keep getting this topic wrong
            existingWeakPoint.failureCount += 1;
            existingWeakPoint.lastFailedAt = Date.now();
            await existingWeakPoint.save();
          } else {
            // Create a brand new weak point
            await WeakPoint.create({
              userId: req.user._id,
              topic: question.topicTag,
              sourceFunction: 'quiz_engine'
            });
          }
        }
      }
    }

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    res.status(200).json({
      message: 'Quiz evaluated successfully',
      score: scorePercentage,
      correctCount,
      totalQuestions,
      results: evaluationResults // Send this back so the UI can show the explanations!
    });

  } catch (error) {
    console.error('Quiz Submission Error:', error);
    res.status(500).json({ message: 'Failed to evaluate quiz', error: error.message });
  }
};

export const generateAdaptiveQuiz = async (req, res) => {
  try {
    const { quantity = 5, difficulty = 'Medium', type = 'multiple_choice' } = req.body;

    // 1. Fetch all unresolved weak points for this user
    const weakPoints = await WeakPoint.find({ userId: req.user._id, mastered: false });

    // 2. If they have no weak points, let the frontend know so it can show the "All Clear!" trophy UI
    if (weakPoints.length === 0) {
      return res.status(200).json({ 
        message: 'No weak points found. Great job!', 
        allClear: true 
      });
    }

    // 3. Extract just the topic names
    const topicsToTest = weakPoints.map(wp => wp.topic);

    // 4. Generate the targeted quiz
    const generatedQuestions = await generateQuizFromTopics(topicsToTest, {
      quantity,
      difficulty,
      type
    });

    // 5. Save the adaptive quiz to the database (sourceMaterialId is null because it comes from weak points)
    const newQuiz = new Quiz({
      userId: req.user._id,
      sourceMaterialId: null, 
      difficulty,
      questions: generatedQuestions
    });

    await newQuiz.save();

    res.status(201).json({
      message: 'Adaptive reinforcement quiz generated successfully',
      quiz: newQuiz,
      targetedTopics: topicsToTest
    });

  } catch (error) {
    console.error('Adaptive Quiz Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate adaptive quiz', error: error.message });
  }
};