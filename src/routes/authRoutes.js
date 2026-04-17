import express from 'express';
import { comparePassword, createToken, hashPassword } from '../lib/auth.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';

const router = express.Router();

const VALID_COURSES = ['mern-stack', 'data-analytics'];

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  const { _id, password, __v, isApproved, enrolledTrack, ...rest } = obj;
  return {
    id:       (_id ?? obj.id)?.toString(),
    approved: isApproved ?? false,
    course:   enrolledTrack ?? null,
    ...rest,
  };
}

router.post('/register', async (request, response, next) => {
  try {
    const { name, email, password, course } = request.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return response.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.trim().length < 6) {
      return response.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (!course || !VALID_COURSES.includes(course)) {
      return response.status(400).json({ message: 'Please select a valid course: MERN Stack or Data Analytics.' });
    }

    const passwordHash = await hashPassword(password.trim());
    const user = new User({
      name:          name.trim(),
      email:         email.trim().toLowerCase(),
      password:      passwordHash,
      enrolledTrack: course,
      isApproved:    false,
    });

    await user.save();

    return response.status(201).json({
      pending: true,
      message: 'Registration successful. Your account is pending admin approval.',
    });
  } catch (err) {
    if (err.code === 11000) {
      return response.status(409).json({ message: 'An account with this email already exists.' });
    }
    next(err);
  }
});

router.post('/login', async (request, response, next) => {
  try {
    const { email, password } = request.body;

    if (!email?.trim() || !password?.trim()) {
      return response.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return response.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = await comparePassword(password.trim(), user.password);

    if (!passwordMatches) {
      return response.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isApproved) {
      return response.status(403).json({
        message: 'Your account is pending admin approval. Please check back later.',
        pending: true,
      });
    }

    return response.json({
      token:    createToken(user._id.toString()),
      user:     sanitizeUser(user),
      progress: user.progress,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (request, response) => {
  return response.json({
    user:     sanitizeUser(request.user),
    progress: request.user.progress,
  });
});

export default router;
