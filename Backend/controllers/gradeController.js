const Grade = require('../models/Grade');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const aiService = require('../services/aiService');

// Create/Update Grade
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId, score, feedback, rubricScores } = req.body;

    const submission = await Submission.findById(submissionId).populate('assignment');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    let grade = await Grade.findOne({ submission: submissionId });
    
    if (!grade) {
      grade = new Grade({
        submission: submissionId,
        assignment: submission.assignment._id,
        student: submission.student,
        teacher: req.userId,
        maxScore: submission.assignment.totalPoints,
      });
    }

    grade.manualGrade = score;
    grade.totalScore = score;
    grade.teacherFeedback = feedback;
    grade.rubricScores = rubricScores || [];
    grade.status = 'graded';
    grade.gradedAt = new Date();

    await grade.save();
    submission.status = 'graded';
    await submission.save();

    res.status(200).json({ message: 'Submission graded', grade });
  } catch (error) {
    res.status(500).json({ message: 'Error grading submission', error: error.message });
  }
};

// Get Grades for Student
exports.getStudentGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.userId })
      .populate('assignment', 'title type')
      .populate('teacher', 'firstName lastName')
      .sort({ gradedAt: -1 });

    res.status(200).json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grades', error: error.message });
  }
};

// Get Grade Details
exports.getGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.gradeId)
      .populate('submission')
      .populate('assignment')
      .populate('student', 'firstName lastName email')
      .populate('teacher', 'firstName lastName');

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    res.status(200).json(grade);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grade', error: error.message });
  }
};

// Get Assignment Class Grades (Teacher)
exports.getClassGrades = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const grades = await Grade.find({ assignment: assignmentId })
      .populate('student', 'firstName lastName email')
      .populate('submission')
      .sort({ totalScore: -1 });

    // Calculate statistics
    const scores = grades.map(g => g.totalScore);
    const stats = {
      count: grades.length,
      average: scores.reduce((a, b) => a + b, 0) / scores.length || 0,
      highest: Math.max(...scores) || 0,
      lowest: Math.min(...scores) || 0,
    };

    res.status(200).json({ grades, stats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class grades', error: error.message });
  }
};

// Add Comment to Grade
exports.addGradeComment = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { text } = req.body;

    const grade = await Grade.findByIdAndUpdate(
      gradeId,
      {
        $push: {
          comments: {
            text,
            author: req.userId,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate('comments.author', 'firstName lastName');

    res.status(200).json({ message: 'Comment added', grade });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Get Grade Comments
exports.getGradeComments = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.gradeId).populate('comments.author', 'firstName lastName');
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    res.status(200).json(grade.comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};
