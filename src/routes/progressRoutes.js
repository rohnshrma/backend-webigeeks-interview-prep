import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

// GET /api/progress — return current user's progress
router.get('/', (request, response) => {
  const p = request.user.progress ?? {};
  return response.json({
    progress: {
      savedQuestions:     p.savedQuestions     ?? [],
      importantQuestions: p.importantQuestions ?? [],
      completedTopics:    p.completedTopics    ?? [],
      topicActions:       p.topicActions       ?? {},
      questionActions:    p.questionActions    ?? {},
    },
  });
});

// PUT /api/progress — bulk overwrite progress (sync on app load)
router.put('/', async (request, response, next) => {
  try {
    const user = request.user;
    const b    = request.body;

    user.progress = {
      savedQuestions:     Array.isArray(b.savedQuestions)     ? b.savedQuestions     : [],
      importantQuestions: Array.isArray(b.importantQuestions) ? b.importantQuestions : [],
      completedTopics:    Array.isArray(b.completedTopics)    ? b.completedTopics    : [],
      topicActions:       typeof b.topicActions    === 'object' && b.topicActions    !== null ? b.topicActions    : (user.progress?.topicActions    ?? {}),
      questionActions:    typeof b.questionActions === 'object' && b.questionActions !== null ? b.questionActions : (user.progress?.questionActions ?? {}),
    };

    user.markModified('progress');
    await user.save();

    return response.json({ progress: user.progress });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/progress/topic-action/:topicId
router.patch('/topic-action/:topicId', async (request, response, next) => {
  try {
    const { topicId } = request.params;
    const { action }  = request.body;

    if (action !== 'completed') {
      return response.status(400).json({ message: 'Invalid topic action.' });
    }

    const user   = request.user;
    const topics = user.progress?.completedTopics ?? [];
    const idx    = topics.indexOf(topicId);

    const updated = idx === -1
      ? [...topics, topicId]
      : topics.filter((id) => id !== topicId);

    user.progress = { ...(user.progress?.toObject?.() ?? user.progress ?? {}), completedTopics: updated };
    user.markModified('progress');
    await user.save();

    return response.json({ completedTopics: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/progress/question-action/:questionId
router.patch('/question-action/:questionId', async (request, response, next) => {
  try {
    const { questionId } = request.params;
    const { action }     = request.body;

    const VALID = ['correct', 'doubtful', 'starred'];
    if (!VALID.includes(action)) {
      return response.status(400).json({ message: 'Invalid question action.' });
    }

    const user     = request.user;
    const existing = user.progress?.toObject?.() ?? user.progress ?? {};
    const qActions = existing.questionActions ?? {};
    const qCurrent = qActions[questionId] ?? { correct: false, doubtful: false, starred: false };

    const updatedQA = {
      ...qActions,
      [questionId]: {
        ...qCurrent,
        [action]: !qCurrent[action],
      },
    };

    user.progress = { ...existing, questionActions: updatedQA };
    user.markModified('progress');
    await user.save();

    return response.json({ questionActions: updatedQA });
  } catch (err) {
    next(err);
  }
});

export default router;
