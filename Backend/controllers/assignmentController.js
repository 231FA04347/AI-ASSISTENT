const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');

const normalizeProgrammingTestCases = (raw = []) => {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(Boolean)
    .map((tc) => {
      // Strip any incoming Mongo-style _id to avoid cast issues
      // and keep our own stable `id` field.
      const { _id, id, input, expectedOutput, output, points } = tc || {};

      return {
        id: typeof id === 'string' && id.trim() ? id : undefined,
        input: input == null ? '' : String(input),
        expectedOutput: expectedOutput == null ? (output == null ? '' : String(output)) : String(expectedOutput),
        points: typeof points === 'number' ? points : Number.parseInt(points, 10) || 1,
      };
    })
    .map((tc, index) => ({
      ...tc,
      id: tc.id || `tc_${Date.now()}_${index}`,
    }));
};

const toLegacyTestCases = (visibleTestCases = []) => {
  if (!Array.isArray(visibleTestCases)) return [];
  return visibleTestCases
    .filter(Boolean)
    .map((tc) => ({
      input: tc.input == null ? '' : String(tc.input),
      output: tc.expectedOutput == null ? '' : String(tc.expectedOutput),
    }));
};

const legacyToVisibleTestCases = (legacy = []) => {
  if (!Array.isArray(legacy)) return [];
  return legacy
    .filter(Boolean)
    .map((tc, index) => {
      const { input, output, expectedOutput } = tc || {};
      return {
        id: `legacy_${Date.now()}_${index}`,
        input: input == null ? '' : String(input),
        expectedOutput: expectedOutput == null ? (output == null ? '' : String(output)) : String(expectedOutput),
        points: 1,
      };
    });
};

const normalizeQuizQuestions = (raw = []) => {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(Boolean)
    .map((q) => {
      const options = Array.isArray(q.options) ? q.options : [];

      let correctAnswer = q.correctAnswer;
      // If correctAnswer is like "0" or "1" etc.
      if (typeof correctAnswer === 'string' && /^\d+$/.test(correctAnswer)) {
        correctAnswer = Number.parseInt(correctAnswer, 10);
      }
      // If correctAnswer is like "A"/"B"/"C"/"D"
      if (typeof correctAnswer === 'string' && /^[A-D]$/i.test(correctAnswer)) {
        correctAnswer = correctAnswer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
      }

      const questionText = q.questionText || q.question || '';

      return {
        id: typeof q.id === 'number' ? q.id : undefined,
        question: q.question || questionText,
        questionText,
        questionType: q.questionType || 'multiple-choice',
        options,
        correctAnswer,
        points: typeof q.points === 'number' ? q.points : Number.parseInt(q.points, 10) || 1,
      };
    });
};

// Create Assignment (Teacher)
exports.createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      className,
      dueDate,
      totalPoints,
      content,
      quizQuestions,
      programmingLanguages,
      // legacy
      testCases,
      // programming (new)
      question,
      visibleTestCases,
      hiddenTestCases,
      rubric,
      difficulty,
    } = req.body;

    const normalizedQuizQuestions = type === 'quiz' ? normalizeQuizQuestions(quizQuestions) : [];

    const safeDescription = type === 'programming' ? '' : description;
    const safeContent = type === 'programming' ? '' : content;

    const normalizedVisible = type === 'programming'
      ? normalizeProgrammingTestCases(Array.isArray(visibleTestCases) ? visibleTestCases : (Array.isArray(testCases) ? legacyToVisibleTestCases(testCases) : []))
      : [];
    const normalizedHidden = type === 'programming'
      ? normalizeProgrammingTestCases(hiddenTestCases)
      : [];
    const normalizedLegacy = type === 'programming' ? toLegacyTestCases(normalizedVisible) : [];

    const assignment = new Assignment({
      title,
      description: safeDescription,
      type,
      teacher: req.userId,
      className,
      dueDate,
      totalPoints,
      content: safeContent,
      quizQuestions: normalizedQuizQuestions,
      programmingLanguages: type === 'programming' ? programmingLanguages : [],
      question: type === 'programming' ? (question || '') : '',
      visibleTestCases: normalizedVisible,
      hiddenTestCases: normalizedHidden,
      // Keep legacy field populated in the expected legacy shape
      testCases: normalizedLegacy,
      rubric: type === 'essay' ? rubric : null,
      difficulty:difficulty || 'easy',
    });

    await assignment.save();
    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      const details = Object.fromEntries(
        Object.entries(error.errors || {}).map(([key, value]) => [key, value?.message || String(value)])
      );
      return res.status(400).json({
        message: 'Validation error',
        error: error.message,
        details,
      });
    }

    return res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};

// Get All Assignments for Teacher
exports.getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.userId }).sort({ createdAt: -1 });
    const normalized = assignments.map((a) => {
      const obj = a.toObject();
      if (obj.type === 'programming') {
        const hasVisible = Array.isArray(obj.visibleTestCases) && obj.visibleTestCases.length > 0;
        const legacyHas = Array.isArray(obj.testCases) && obj.testCases.length > 0;
        if (!hasVisible && legacyHas) obj.visibleTestCases = legacyToVisibleTestCases(obj.testCases);
      }
      return obj;
    });
    res.status(200).json(normalized);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

// Get All Assignments for Student
exports.getStudentAssignments = async (req, res) => {
  try {
    const student = await User.findById(req.userId).select('className role');
    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }

    const studentClassName = (student.className || '10').toString().trim() || '10';

    const assignments = await Assignment.find({ className: studentClassName }).sort({ dueDate: 1 });
    // Get submissions to check which assignments are submitted
    const submissions = await Submission.find({ student: req.userId });
    // Map assignmentId to submission status
    const submissionStatusMap = {};
    submissions.forEach(s => {
      submissionStatusMap[s.assignment.toString()] = s.status;
    });

    const assignmentsWithStatus = assignments.map(assignment => {
      const obj = assignment.toObject();
      if (obj.type === 'programming') {
        const hasVisible = Array.isArray(obj.visibleTestCases) && obj.visibleTestCases.length > 0;
        const legacyHas = Array.isArray(obj.testCases) && obj.testCases.length > 0;
        if (!hasVisible && legacyHas) obj.visibleTestCases = legacyToVisibleTestCases(obj.testCases);
      }
      // Only mark as submitted if status is 'submitted' or 'graded'
      const status = submissionStatusMap[assignment._id.toString()];
      return {
        ...obj,
        submitted: status === 'submitted' || status === 'graded',
      };
    });

    res.status(200).json(assignmentsWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

// Get Single Assignment
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId).populate('teacher', 'firstName lastName');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    const obj = assignment.toObject();
    if (obj.type === 'programming') {
      const hasVisible = Array.isArray(obj.visibleTestCases) && obj.visibleTestCases.length > 0;
      const legacyHas = Array.isArray(obj.testCases) && obj.testCases.length > 0;
      if (!hasVisible && legacyHas) obj.visibleTestCases = legacyToVisibleTestCases(obj.testCases);
    }
    res.status(200).json(obj);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignment', error: error.message });
  }
};

// Update Assignment (Teacher)
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this assignment' });
    }

    const update = { ...req.body };

    // Keep type-specific fields consistent and normalize quizQuestions
    if (update.type === 'quiz' || assignment.type === 'quiz') {
      if ('quizQuestions' in update) {
        update.quizQuestions = normalizeQuizQuestions(update.quizQuestions);
      }
    }

    if (update.type && update.type !== assignment.type) {
      if (update.type !== 'quiz') update.quizQuestions = [];
      if (update.type !== 'programming') {
        update.programmingLanguages = [];
        update.testCases = [];
        update.question = '';
        update.visibleTestCases = [];
        update.hiddenTestCases = [];
      }
      if (update.type !== 'essay') update.rubric = null;
    }

    // Programming assignments: keep legacy + new fields in sync and ensure arrays
    if ((update.type || assignment.type) === 'programming') {
      if ('question' in update && typeof update.question !== 'string') {
        update.question = update.question == null ? '' : String(update.question);
      }
      if ('visibleTestCases' in update && !Array.isArray(update.visibleTestCases)) {
        update.visibleTestCases = [];
      }
      if ('hiddenTestCases' in update && !Array.isArray(update.hiddenTestCases)) {
        update.hiddenTestCases = [];
      }

      // If teacher sends legacy testCases only, treat them as visible
      if (!('visibleTestCases' in update) && Array.isArray(update.testCases)) {
        update.visibleTestCases = legacyToVisibleTestCases(update.testCases);
      }
      // Normalize visible/hidden test cases and keep legacy testCases in {input, output}
      if (Array.isArray(update.visibleTestCases)) {
        update.visibleTestCases = normalizeProgrammingTestCases(update.visibleTestCases);
        update.testCases = toLegacyTestCases(update.visibleTestCases);
      }
      if (Array.isArray(update.hiddenTestCases)) {
        update.hiddenTestCases = normalizeProgrammingTestCases(update.hiddenTestCases);
      }
    }

    Object.assign(assignment, update);
    await assignment.save();
    res.status(200).json({ message: 'Assignment updated', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
};

// Delete Assignment (Teacher)
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }

    await Assignment.findByIdAndDelete(req.params.assignmentId);
    await Submission.deleteMany({ assignment: req.params.assignmentId });

    res.status(200).json({ message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting assignment', error: error.message });
  }
};

// Get Assignment Submissions (Teacher)
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'firstName lastName email')
      .sort({ submittedAt: -1 });

    // Fetch grades for each submission
    const Grade = require('../models/Grade');
    const submissionsWithGrades = await Promise.all(
      submissions.map(async (submission) => {
        const grade = await Grade.findOne({ submission: submission._id });
        return {
          ...submission.toObject(),
          grade: grade ? {
            autoGrade: grade.autoGrade,
            totalScore: grade.totalScore,
            maxScore: grade.maxScore,
            aiGeneratedFeedback: grade.aiGeneratedFeedback,
            teacherFeedback: grade.teacherFeedback,
          } : null
        };
      })
    );

    res.status(200).json(submissionsWithGrades);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};
