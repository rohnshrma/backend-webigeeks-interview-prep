import mongoose from 'mongoose';

// ---------- Choice sub-schema (for output/MCQ questions) ----------
const choiceSchema = new mongoose.Schema(
  {
    label:   { type: String, required: true },
    correct: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

// ---------- Question schema ----------
const questionSchema = new mongoose.Schema(
  {
    // Stable, human-readable identifier (e.g. "html-f1")
    questionId: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
      index:    true,
    },

    // Which topic this question belongs to (e.g. "html", "react", "sql")
    topicId: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },

    // Which track (e.g. "mern-stack", "data-analytics")
    trackId: {
      type:    String,
      required: true,
      trim:    true,
    },

    // Audience
    experienceLevel: {
      type:    String,
      enum:    ['fresher', 'junior', 'mid'],
      required: true,
      index:   true,
    },

    // Format
    type: {
      type:    String,
      enum:    ['conceptual', 'practical', 'output'],
      required: true,
    },

    question:    { type: String, required: true },
    answer:      { type: String, required: true },
    code:        { type: String, default: '' },
    explanation: { type: String, default: '' },
    output:      { type: String, default: '' },   // expected output for MCQ
    choices:     { type: [choiceSchema], default: [] },

    // Allow admin soft-delete without losing data
    isActive:  { type: Boolean, default: true, index: true },

    // Sort order within a topic
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for the most common query pattern
questionSchema.index({ topicId: 1, experienceLevel: 1, isActive: 1, order: 1 });

export const Question = mongoose.model('Question', questionSchema);
