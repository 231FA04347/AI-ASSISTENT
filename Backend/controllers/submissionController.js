// End Test for Submission (Student)
exports.endTestForSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    // Only the student who owns the submission can end the test
    if (submission.student.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to end this test' });
    }
    // Mark as submitted (or completed)
    submission.status = 'submitted';
    submission.submittedAt = new Date();
    await submission.save();
    res.status(200).json({ message: 'Test ended and submission marked as complete', submission });
  } catch (error) {
    res.status(500).json({ message: 'Error ending test', error: error.message });
  }
};
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Grade = require('../models/Grade');
const PlagiarismReport = require('../models/PlagiarismReport');
const aiService = require('../services/aiService');

const normalizeText = (input) => {
  if (!input) return '';
  return String(input)
    .toLowerCase()
    .replace(/\r\n/g, '\n')
    .replace(/[^a-z0-9\n\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildWordShingles = (text, shingleSize = 5) => {
  const words = normalizeText(text).split(' ').filter(Boolean);
  if (words.length < shingleSize) return new Set(words);
  const set = new Set();
  for (let i = 0; i <= words.length - shingleSize; i++) {
    set.add(words.slice(i, i + shingleSize).join(' '));
  }
  return set;
};

const jaccardSimilarityPercent = (setA, setB) => {
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  if (!union) return 0;
  return Math.round((intersection / union) * 100);
};

const pickMatchedSections = (setA, setB, max = 6) => {
  const matched = [];
  for (const item of setA) {
    if (setB.has(item)) {
      matched.push(item);
      if (matched.length >= max) break;
    }
  }
  return matched;
};

// Submit Assignment
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, content, code, quizAnswers, score, totalPoints, percentage } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.userId,
    });

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.content = content;
      existingSubmission.code = code || existingSubmission.code;
      existingSubmission.submittedAt = new Date();
      existingSubmission.isLate = new Date() > assignment.dueDate;
      await existingSubmission.save();

      return res.status(200).json({ message: 'Submission updated', submission: existingSubmission });
    }

    // Create new submission
    const submission = new Submission({
      assignment: assignmentId,
      student: req.userId,
      content,
      code: code || null,
      isLate: new Date() > assignment.dueDate,
    });

    await submission.save();

    // Auto-grading for quizzes with auto-grade assignment
    if (assignment.type === 'quiz') {
      try {
        const earnedScore = score || 0;
        const maxScore = totalPoints || assignment.totalPoints;
        const percentageScore = percentage || ((earnedScore / maxScore) * 100);

        // Auto-assign grade letter based on percentage
        const getLetterGrade = (percent) => {
          if (percent >= 90) return 'A';
          if (percent >= 80) return 'B';
          if (percent >= 70) return 'C';
          if (percent >= 60) return 'D';
          return 'F';
        };

        const letterGrade = getLetterGrade(percentageScore);

        const grade = new Grade({
          submission: submission._id,
          assignment: assignmentId,
          student: req.userId,
          autoGrade: earnedScore,
          totalScore: earnedScore,
          maxScore: maxScore,
          aiGeneratedFeedback: `Quiz auto-graded: ${percentageScore.toFixed(2)}% (${letterGrade})`,
          rubricScores: [{
            criteriaName: 'Quiz Score',
            points: earnedScore,
          }],
        });

        await grade.save();
        submission.status = 'graded';
        await submission.save();
      } catch (error) {
        console.error('Auto-grading quiz failed:', error);
      }
    }

    res.status(201).json({ message: 'Assignment submitted', submission });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting assignment', error: error.message });
  }
};

// Get Student Submissions
exports.getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.userId })
      .populate('assignment', 'title type dueDate')
      .sort({ submittedAt: -1 });

    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

// Get Submission Details
exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId)
      .populate('assignment')
      .populate('student', 'firstName lastName email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submission', error: error.message });
  }
};

// Request AI Feedback
exports.requestAIFeedback = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId).populate('assignment');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const assignment = submission.assignment;
    let feedback = '';

    if (assignment.type === 'essay') {
      const analysis = await aiService.analyzeEssay(submission.content);
      feedback = analysis.analysis;
    } else if (assignment.type === 'programming') {
      const gradeResult = await aiService.gradeProgrammingAssignment(submission.code, assignment.testCases);
      feedback = `Test Results: ${JSON.stringify(gradeResult, null, 2)}`;
    }

    // Generate AI feedback
    const aiFeedback = await aiService.generateFeedback(submission.content, assignment.type, { score: 0 });

    // Save feedback to grade
    let grade = await Grade.findOne({ submission: submissionId });
    if (!grade) {
      grade = new Grade({
        submission: submissionId,
        assignment: assignment._id,
        student: submission.student,
        maxScore: assignment.totalPoints,
      });
    }

    grade.aiGeneratedFeedback = aiFeedback;
    await grade.save();

    res.status(200).json({ message: 'AI feedback generated', feedback: aiFeedback });
  } catch (error) {
    res.status(500).json({ message: 'Error generating feedback', error: error.message });
  }
};

// Check Plagiarism
exports.checkPlagiarism = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId).populate('assignment');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Skip plagiarism check for quiz assignments
    if (submission.assignment.type === 'quiz') {
      return res.status(400).json({ message: 'Plagiarism check is not applicable for quiz assignments' });
    }

    // Compare against other submissions for the same assignment.
    const others = await Submission.find({
      assignment: submission.assignment._id,
      _id: { $ne: submission._id },
    })
      .populate('student', 'firstName lastName email')
      .select('content code student submittedAt');

    const subjectText = submission.code || submission.content;
    const subjectShingles = buildWordShingles(subjectText, submission.code ? 8 : 5);

    const matches = others
      .map((other) => {
        const otherText = other.code || other.content;
        const otherShingles = buildWordShingles(otherText, other.code ? 8 : 5);
        const similarity = jaccardSimilarityPercent(subjectShingles, otherShingles);
        return {
          other,
          similarity,
          matchedSections: pickMatchedSections(subjectShingles, otherShingles, 6),
        };
      })
      .sort((a, b) => b.similarity - a.similarity);

    const topMatches = matches.slice(0, 5).filter((m) => m.similarity > 0);
    const similarityScore = topMatches.length ? topMatches[0].similarity : 0;

    const matchedSubmissions = topMatches.map((m) => ({
      submissionId: m.other._id,
      studentName: `${m.other.student?.firstName || ''} ${m.other.student?.lastName || ''}`.trim() || m.other.student?.email || 'Unknown',
      similarityPercentage: m.similarity,
      matchedSections: m.matchedSections,
    }));

    const lines = [];
    lines.push(`Compared against ${others.length} other submission(s) for this assignment.`);
    if (!matchedSubmissions.length) {
      lines.push('No similar submissions detected based on text/code overlap.');
    } else {
      lines.push('Top potential matches:');
      for (const m of matchedSubmissions) {
        lines.push(`- ${m.studentName}: ${m.similarityPercentage}% similarity`);
      }
      lines.push('Recommendation: review the matched sections and context before taking action.');
    }

    // Persist (upsert) a single report per submission.
    const report = await PlagiarismReport.findOneAndUpdate(
      { submission: submissionId },
      {
        submission: submissionId,
        assignment: submission.assignment._id,
        student: submission.student,
        similarityScore,
        matchedSubmissions,
        externalMatches: [],
        report: lines.join('\n'),
        isChecked: true,
        checkedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Plagiarism check completed', report });
  } catch (error) {
    res.status(500).json({ message: 'Error checking plagiarism', error: error.message });
  }
};

// Get Plagiarism Report
exports.getPlagiarismReport = async (req, res) => {
  try {
    const report = await PlagiarismReport.findOne({ submission: req.params.submissionId });
    if (!report) {
      return res.status(404).json({ message: 'No plagiarism report found' });
    }
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plagiarism report', error: error.message });
  }
};
