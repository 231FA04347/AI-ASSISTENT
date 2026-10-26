const mongoose = require('mongoose');

const plagiarismReportSchema = new mongoose.Schema({
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
  similarityScore: {
    type: Number,
    required: true,
  },
  matchedSubmissions: [{
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
    },
    studentName: String,
    similarityPercentage: Number,
    matchedSections: [String],
  }],
  externalMatches: [{
    source: String,
    url: String,
    matchPercentage: Number,
  }],
  report: String,
  isChecked: {
    type: Boolean,
    default: false,
  },
  checkedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('PlagiarismReport', plagiarismReportSchema);
