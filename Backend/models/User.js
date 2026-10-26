const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['teacher', 'student'],
    required: true,
  },
  // Student's class/grade (e.g., "10"). Used to deliver assignments by class.
  // Teachers don't need this.
  className: {
    type: String,
    trim: true,
    required: function () {
      return this.role === 'student';
    },
  },
  profilePicture: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
