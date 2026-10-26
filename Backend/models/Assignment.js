const mongoose = require('mongoose');

const programmingTestCaseSchema = new mongoose.Schema(
  {
    id: String,
    input: String,
    expectedOutput: String,
    points: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const legacyTestCaseSchema = new mongoose.Schema(
  {
    input: String,
    output: String,
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema({
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: function requiredDescription() {
      return this.type !== 'programming';
    },
    default: '',
  },
  type: {
    type: String,
    enum: ['quiz', 'programming', 'essay'],
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  className: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  totalPoints: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: function requiredContent() {
      return this.type !== 'programming';
    },
    default: '',
  },
  quizQuestions: [
    {
      // Frontend currently uses `id`, `question`, `options`, `correctAnswer` (index), `points`
      // Keep `questionText` for backward compatibility.
      id: Number,
      question: String,
      questionText: String,
      questionType: {
        type: String,
        enum: ['multiple-choice', 'short-answer', 'essay'],
      },
      options: [String],
      // Support both numeric index (0..n) and legacy string formats.
      correctAnswer: mongoose.Schema.Types.Mixed,
      points: Number,
    },
  ],
  programmingLanguages: [String],
  question: {
    type: String,
    default: null,
  },
  visibleTestCases: [programmingTestCaseSchema],
  hiddenTestCases: [programmingTestCaseSchema],
  testCases: [legacyTestCaseSchema],
  rubric: {
    criteria: [{
      name: String,
      description: String,
      maxPoints: Number,
    }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
