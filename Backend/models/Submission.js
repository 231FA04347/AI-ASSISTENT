const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    default: null,
  },
  fileUrl: {
    type: String,
    default: null,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  isLate: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'reviewed'],
    default: 'submitted',
  },
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
