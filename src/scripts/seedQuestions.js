/**
 * WebiGeeks — Question Seeder
 * Run: node src/scripts/seedQuestions.js
 *
 * Upserts all questions from the frontend question bank into MongoDB.
 * Safe to re-run — uses questionId as the unique key (no duplicates).
 */

import mongoose from 'mongoose';
import { MONGO_URI } from '../config.js';
import { Question } from '../models/Question.js';

// ── Raw question data (copied from frontend question files) ─────────────────
// Each entry: { id, topicId?, experienceLevel, type, question, answer, code?, explanation?, output?, choices? }
// topicId and trackId are added by the TOPIC_MAP below.

const TOPIC_MAP = {
  // MERN Stack
  'html':                    'mern-stack',
  'css':                     'mern-stack',
  'flexbox':                 'mern-stack',
  'javascript':              'mern-stack',
  'react':                   'mern-stack',
  'node-js':                 'mern-stack',
  'express-js':              'mern-stack',
  'mongodb':                 'mern-stack',
  'mongoose':                'mern-stack',
  'authentication':          'mern-stack',
  'bcrypt':                  'mern-stack',
  'jwt':                     'mern-stack',
  'passport-local':          'mern-stack',
  'passport-google-oauth20': 'mern-stack',
  // Data Analytics
  'excel':       'data-analytics',
  'sql':         'data-analytics',
  'python':      'data-analytics',
  'py':          'data-analytics',
  'pandas':      'data-analytics',
  'pd':          'data-analytics',
  'numpy':       'data-analytics',
  'np':          'data-analytics',
  'matplotlib':  'data-analytics',
  'tableau':     'data-analytics',
  'tab':         'data-analytics',
  'power-bi':    'data-analytics',
  'pbi':         'data-analytics',
  'bcr':         'mern-stack',
  'mong':        'mern-stack',
  'mdb':         'mern-stack',
  'exp':         'mern-stack',
  'js':          'mern-stack',
  'xl':          'data-analytics',
};

// Derive topic from the question's id prefix (e.g. "html-f1" → "html")
function deriveTopicId(questionId) {
  // id format: <topic>-<level><number>  e.g. html-f1, node-j2, power-bi-m1
  // We match against known topic keys (longest match wins)
  const sorted = Object.keys(TOPIC_MAP).sort((a, b) => b.length - a.length);
  for (const topic of sorted) {
    const safe = topic.replace(/-/g, '-'); // same
    if (questionId.startsWith(safe + '-')) return topic;
  }
  // Fallback: take everything before the last -<level><digit>
  return questionId.replace(/-[fmj]\d+$/, '');
}

import { HTML_QUESTIONS, CSS_QUESTIONS } from '../data/q_html_css.js';
import { JS_QUESTIONS, REACT_QUESTIONS } from '../data/q_js_react.js';
import { NODE_QUESTIONS, EXPRESS_QUESTIONS } from '../data/q_node_express.js';
import { MONGO_QUESTIONS, MONGOOSE_QUESTIONS } from '../data/q_mongodb_mongoose.js';
import { AUTH_QUESTIONS, JWT_QUESTIONS } from '../data/q_auth_jwt.js';
import { SQL_QUESTIONS, PYTHON_QUESTIONS } from '../data/q_sql_python.js';
import { ANALYTICS_QUESTIONS } from '../data/q_analytics.js';

// ── Inline question bank ─────────────────────────────────────────────────────
// This mirrors the frontend files exactly so the DB stays in sync.
// When you add questions to the frontend files, add them here too (or run a
// shared importer script from a shared JSON — that's the next evolution).

const RAW_QUESTIONS = [
  ...HTML_QUESTIONS,
  ...CSS_QUESTIONS,
  ...JS_QUESTIONS,
  ...REACT_QUESTIONS,
  ...NODE_QUESTIONS,
  ...EXPRESS_QUESTIONS,
  ...MONGO_QUESTIONS,
  ...MONGOOSE_QUESTIONS,
  ...AUTH_QUESTIONS,
  ...JWT_QUESTIONS,
  ...SQL_QUESTIONS,
  ...PYTHON_QUESTIONS,
  ...ANALYTICS_QUESTIONS,
];

// ── Core seed logic (reusable — caller manages DB connection) ────────────────
export async function seedQuestions() {
  let inserted = 0;
  let updated  = 0;
  let errors   = 0;

  for (let i = 0; i < RAW_QUESTIONS.length; i++) {
    const raw = RAW_QUESTIONS[i];
    const topicId = deriveTopicId(raw.id);
    const trackId = TOPIC_MAP[topicId] ?? 'mern-stack';

    const doc = {
      questionId:      raw.id,
      topicId,
      trackId,
      experienceLevel: raw.experienceLevel,
      type:            raw.type,
      question:        raw.question,
      answer:          raw.answer,
      code:            raw.code        ?? '',
      explanation:     raw.explanation ?? '',
      output:          raw.output      ?? '',
      choices:         raw.choices     ?? [],
      order:           i,
      isActive:        true,
    };

    try {
      const result = await Question.updateOne(
        { questionId: raw.id },
        { $set: doc },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++;
      else if (result.modifiedCount) updated++;
    } catch (err) {
      console.error(`  ✗ Failed: ${raw.id} — ${err.message}`);
      errors++;
    }
  }

  console.log('\n────────────────────────────────');
  console.log(`✅ Seed complete:`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Total:    ${RAW_QUESTIONS.length}`);
  return { inserted, updated, errors };
}

// ── Standalone CLI runner (npm run seed) ─────────────────────────────────────
// Only runs when this script is executed directly, not when imported.
if (process.argv[1].includes('seedQuestions')) {
  (async () => {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to: ${MONGO_URI}`);
    await seedQuestions();
    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
