import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { CLIENT_ORIGIN, HOST, MONGO_URI, PORT } from './config.js';
import authRoutes from './routes/authRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import { Question } from './models/Question.js';

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:   'ok',
    message:  'WebiGeeks API is running.',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth',      authRoutes);
app.use('/api/progress',  progressRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/questions', questionRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ message: err.message ?? 'Internal server error.' });
});

// ── Auto-seed if collection is empty ──────────────────────────────────────
async function autoSeedIfEmpty() {
  const count = await Question.countDocuments();
  if (count > 0) {
    console.log(`Questions already seeded (${count} found). Skipping auto-seed.`);
    return;
  }
  console.log('Question collection is empty — running auto-seed…');
  try {
    // Dynamically import the seed function so it only loads when needed
    const { seedQuestions } = await import('./scripts/seedQuestions.js');
    await seedQuestions();
    console.log('Auto-seed complete ✓');
  } catch (err) {
    console.error('Auto-seed failed (non-fatal):', err.message);
  }
}

// ── Start ──────────────────────────────────────────────────────────────────
async function start() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}…`);
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected ✓');

  await autoSeedIfEmpty();

  app.listen(PORT, HOST, () => {
    console.log(`WebiGeeks backend listening on http://${HOST}:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

