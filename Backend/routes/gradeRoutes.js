const express = require('express');
const gradeController = require('../controllers/gradeController');
const { authMiddleware, checkRole } = require('../middleware/auth');

const router = express.Router();

// Teacher routes
router.post('/', authMiddleware, checkRole('teacher'), gradeController.gradeSubmission);
router.get('/class/:assignmentId', authMiddleware, checkRole('teacher'), gradeController.getClassGrades);
router.post('/:gradeId/comment', authMiddleware, gradeController.addGradeComment);
router.get('/:gradeId/comments', authMiddleware, gradeController.getGradeComments);

// Student routes
router.get('/my-grades', authMiddleware, checkRole('student'), gradeController.getStudentGrades);

// Both routes
router.get('/:gradeId', authMiddleware, gradeController.getGrade);

module.exports = router;
