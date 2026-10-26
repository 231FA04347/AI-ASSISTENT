const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const { authMiddleware, checkRole } = require('../middleware/auth');

const router = express.Router();

// Teacher routes
router.post('/', authMiddleware, checkRole('teacher'), assignmentController.createAssignment);
router.get('/teacher', authMiddleware, checkRole('teacher'), assignmentController.getTeacherAssignments);
router.get('/submissions/:assignmentId', authMiddleware, checkRole('teacher'), assignmentController.getAssignmentSubmissions);
router.put('/:assignmentId', authMiddleware, checkRole('teacher'), assignmentController.updateAssignment);
router.delete('/:assignmentId', authMiddleware, checkRole('teacher'), assignmentController.deleteAssignment);

// Student routes
router.get('/student', authMiddleware, checkRole('student'), assignmentController.getStudentAssignments);

// Public/Both routes
router.get('/:assignmentId', authMiddleware, assignmentController.getAssignment);

module.exports = router;
