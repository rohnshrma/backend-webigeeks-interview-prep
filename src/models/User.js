import mongoose from 'mongoose';

// ---------- Progress sub-schema ----------
const progressSchema = new mongoose.Schema(
  {
    savedQuestions:    { type: [String], default: [] },
    importantQuestions:{ type: [String], default: [] },
    completedTopics:   { type: [String], default: [] },
    topicActions:      { type: mongoose.Schema.Types.Mixed, default: {} },
    // questionActions: { [questionId]: { correct, doubtful, starred } }
    questionActions:   { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

// ---------- User schema ----------
const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // Which course they enrolled in
    enrolledTrack: {
      type:    String,
      enum:    ['mern-stack', 'data-analytics'],
      default: null,
    },

    isApproved: { type: Boolean, default: false },
    progress:   { type: progressSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
