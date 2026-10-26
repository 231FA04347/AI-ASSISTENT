const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true,
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  autoGrade: {
    type: Number,
    default: 0,
  },
  manualGrade: {
    type: Number,
    default: null,
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  maxScore: {
    type: Number,
    required: true,
  },
  aiGeneratedFeedback: {
    type: String,
    default: null,
  },
  teacherFeedback: {
    type: String,
    default: null,
  },
  rubricScores: [{
    criteriaName: String,
    points: Number,
  }],
  comments: [{
    text: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  gradedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);
