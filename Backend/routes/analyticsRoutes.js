const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, checkRole } = require('../middleware/auth');

const router = express.Router();

// IMPORTANT: put static/prefix routes before '/:assignmentId' to avoid being shadowed.

// Teacher routes
router.get('/dashboard', authMiddleware, checkRole('teacher'), analyticsController.getTeacherDashboardAnalytics);
router.get('/:assignmentId/learning-outcomes', authMiddleware, checkRole('teacher'), analyticsController.analyzeLearningOutcomes);
router.get('/:assignmentId/export', authMiddleware, checkRole('teacher'), analyticsController.exportAssignmentReport);
// Student routes
router.get('/performance/:studentId', authMiddleware, analyticsController.getStudentPerformanceAnalytics);

router.get('/:assignmentId', authMiddleware, checkRole('teacher'), analyticsController.getAssignmentAnalytics);
router.post('/:assignmentId', authMiddleware, checkRole('teacher'), analyticsController.generateClassAnalytics);

module.exports = router;
