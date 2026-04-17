import express from 'express';
import { createAdminToken } from '../lib/auth.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../config.js';
import { User } from '../models/User.js';

const router = express.Router();

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
}

// Admin login
router.post('/login', async (request, response) => {
  const { email, password } = request.body;

  if (!email?.trim() || !password?.trim()) {
    return response.status(400).json({ message: 'Email and password are required.' });
  }

  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return response.status(401).json({ message: 'Invalid admin credentials.' });
  }

  if (password.trim() !== ADMIN_PASSWORD) {
    return response.status(401).json({ message: 'Invalid admin credentials.' });
  }

  return response.json({
    token: createAdminToken(),
    admin: { email: ADMIN_EMAIL, name: 'Admin' },
  });
});

// Get all students
router.get('/students', requireAdmin, async (request, response, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const students = users.map((user) => {
      const { password, __v, ...rest } = user;
      return {
        ...rest,
        progress: {
          savedQuestions:     user.progress?.savedQuestions     ?? [],
          importantQuestions: user.progress?.importantQuestions ?? [],
          completedTopics:    user.progress?.completedTopics    ?? [],
          topicActions:       user.progress?.topicActions       ?? {},
          questionActions:    user.progress?.questionActions    ?? {},
        },
      };
    });
    return response.json({ students });
  } catch (err) {
    next(err);
  }
});

// Approve a student
router.patch('/students/:id/approve', requireAdmin, async (request, response, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      request.params.id,
      { $set: { isApproved: true } },
      { new: true }
    );

    if (!user) {
      return response.status(404).json({ message: 'Student not found.' });
    }

    return response.json({ student: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

// Reject / delete a student
router.delete('/students/:id', requireAdmin, async (request, response, next) => {
  try {
    const result = await User.findByIdAndDelete(request.params.id);

    if (!result) {
      return response.status(404).json({ message: 'Student not found.' });
    }

    return response.json({ message: 'Student removed.' });
  } catch (err) {
    next(err);
  }
});

export default router;
