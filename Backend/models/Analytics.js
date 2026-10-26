const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  className: String,
  totalStudents: Number,
  submittedStudents: Number,
  gradedStudents: Number,
  averageScore: Number,
  highestScore: Number,
  lowestScore: Number,
  scoreDistribution: {
    excellent: Number,
    good: Number,
    average: Number,
    poor: Number,
  },
  commonMistakes: [String],
  learningOutcomes: {
    outcomes: [{
      name: String,
      achievementRate: Number,
    }],
  },
  submissionAnalysis: {
    onTimeCount: Number,
    lateCount: Number,
    averageSubmissionTime: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
