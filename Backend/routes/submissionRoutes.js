const express = require('express');
const submissionController = require('../controllers/submissionController');
const { authMiddleware, checkRole } = require('../middleware/auth');

const router = express.Router();


// Student routes
router.post('/', authMiddleware, checkRole('student'), submissionController.submitAssignment);
router.get('/my-submissions', authMiddleware, checkRole('student'), submissionController.getStudentSubmissions);
// End Test (Student)
router.post('/:submissionId/end-test', authMiddleware, checkRole('student'), submissionController.endTestForSubmission);

// Both routes
router.get('/:submissionId', authMiddleware, submissionController.getSubmission);

// AI services
router.post('/:submissionId/ai-feedback', authMiddleware, submissionController.requestAIFeedback);
router.post('/:submissionId/plagiarism-check', authMiddleware, checkRole('teacher'), submissionController.checkPlagiarism);
router.get('/:submissionId/plagiarism-report', authMiddleware, submissionController.getPlagiarismReport);

module.exports = router;
