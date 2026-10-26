const express = require('express');
const codeExecutionService = require('../services/codeExecutionService');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Grade = require('../models/Grade');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Execute code for programming assignment (visible test cases only)
router.post('/execute-code', authMiddleware, async (req, res) => {
  try {
    const { code, language, assignmentId } = req.body;

    if (!code || !language) {
      return res.status(400).json({ success: false, message: 'Code and language are required' });
    }

    if (!assignmentId) {
      return res.status(400).json({ success: false, message: 'Assignment ID is required' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.type !== 'programming') {
      return res.status(400).json({ success: false, message: 'This is not a programming assignment' });
    }

    const visibleTestCases = assignment.visibleTestCases || assignment.testCases || [];
    
    // If no test cases, just run the code with empty input
    if (!visibleTestCases || visibleTestCases.length === 0) {
      const result = await codeExecutionService.executeCode(code, language, '');
      if (!result.success) {
        const status = result.hint ? 503 : 200;
        return res.status(status).json(result);
      }

      return res.status(200).json({
        success: true,
        results: [],
        message: 'Code executed. No test cases available for this assignment.',
      });
    }

    // Execute code with visible test cases only (student preview)
    const result = await codeExecutionService.executeWithVisibleTestCases(
      code,
      language,
      visibleTestCases
    );

    const status = result.success ? 200 : (result.hint ? 503 : 200);
    res.status(status).json(result);
  } catch (error) {
    console.error('Code execution route error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error executing code', 
      error: error.message 
    });
  }
});

// Grade programming submission (visible + hidden test cases)
router.post('/grade-submission', authMiddleware, async (req, res) => {
  try {
    const { code, language, assignmentId, submissionId } = req.body;

    if (!code || !language || !assignmentId) {
      return res.status(400).json({ message: 'Code, language, and assignmentId are required' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.type !== 'programming') {
      return res.status(400).json({ message: 'This is not a programming assignment' });
    }

    // Grade with both visible and hidden test cases
    const gradeResult = await codeExecutionService.gradeProgrammingSubmission(
      code,
      language,
      assignment.visibleTestCases || [],
      assignment.hiddenTestCases || []
    );

    // Save grade to database
    if (gradeResult.success) {
      let grade = await Grade.findOne({ submission: submissionId });
      if (!grade) {
        grade = new Grade({
          submission: submissionId,
          assignment: assignmentId,
          student: req.userId,
          maxScore: assignment.totalPoints,
        });
      }

      grade.totalScore = Math.round((gradeResult.totalScore / gradeResult.totalMaxScore) * assignment.totalPoints);
      grade.rubricScores = [{
        criteriaName: 'Visible Test Cases',
        points: Math.round((gradeResult.visibleScore / gradeResult.visibleMaxScore) * (assignment.totalPoints / 2)),
      }, {
        criteriaName: 'Hidden Test Cases',
        points: Math.round((gradeResult.hiddenScore / gradeResult.hiddenMaxScore) * (assignment.totalPoints / 2)),
      }];
      grade.aiGeneratedFeedback = `Visible: ${gradeResult.visibleScore}/${gradeResult.visibleMaxScore} | Hidden: ${gradeResult.hiddenScore}/${gradeResult.hiddenMaxScore} | Total: ${gradeResult.percentage.toFixed(1)}%`;

      await grade.save();
    }

    // Return only visible results to student
    res.status(200).json({
      success: gradeResult.success,
      visibleResults: gradeResult.visibleResults,
      visibleScore: gradeResult.visibleScore,
      visibleMaxScore: gradeResult.visibleMaxScore,
      message: 'Your submission has been graded. Final score includes hidden test cases.',
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error grading submission', 
      error: error.message 
    });
  }
});

// Run code without test cases (just for output)
router.post('/run-code', authMiddleware, async (req, res) => {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return res.status(400).json({ success: false, message: 'Code and language are required' });
    }

    const result = await codeExecutionService.executeCode(code, language, input || '');

    const status = result.success ? 200 : (result.hint ? 503 : 200);
    res.status(status).json(result);
  } catch (error) {
    console.error('Run code route error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error running code', 
      error: error.message 
    });
  }
});

module.exports = router;
