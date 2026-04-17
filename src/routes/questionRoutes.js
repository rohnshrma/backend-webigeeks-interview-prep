import express from 'express';
import { Question } from '../models/Question.js';

const router = express.Router();

/**
 * GET /api/questions/:topicId
 * Optional query: ?experienceLevel=fresher|junior|mid
 * Returns questions for a topic from MongoDB.
 */
router.get('/:topicId', async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { experienceLevel } = req.query;

    const filter = { topicId, isActive: true };
    if (experienceLevel && ['fresher', 'junior', 'mid'].includes(experienceLevel)) {
      filter.experienceLevel = experienceLevel;
    }

    const questions = await Question.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean(); // plain JS objects — faster, no Mongoose overhead

    res.json({ topicId, count: questions.length, questions });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/questions
 * Optional query: ?topicId=html&experienceLevel=fresher
 * Returns all or filtered questions.
 */
router.get('/', async (req, res, next) => {
  try {
    const { topicId, trackId, experienceLevel } = req.query;

    const filter = { isActive: true };
    if (topicId)         filter.topicId = topicId;
    if (trackId)         filter.trackId = trackId;
    if (experienceLevel && ['fresher', 'junior', 'mid'].includes(experienceLevel)) {
      filter.experienceLevel = experienceLevel;
    }

    const questions = await Question.find(filter)
      .sort({ topicId: 1, order: 1 })
      .lean();

    res.json({ count: questions.length, questions });
  } catch (err) {
    next(err);
  }
});

export default router;
