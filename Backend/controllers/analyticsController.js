const Analytics = require('../models/Analytics');
const Grade = require('../models/Grade');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const PlagiarismReport = require('../models/PlagiarismReport');
const aiService = require('../services/aiService');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');

const toSafeFilename = (input) => {
  const raw = String(input || 'report')
    .replace(/[\r\n\t]+/g, ' ')
    .trim();
  const safe = raw
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return safe.length ? safe.slice(0, 120) : 'report';
};

const getLetterGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 65) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

const normalizeClassValue = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const match = raw.match(/^class\s*(.+)$/i);
  return (match ? match[1] : raw).trim();
};

const truncateForExcelCell = (value, maxChars = 32000) => {
  if (value == null) return '';
  const text = String(value);
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 20) + '\n...(truncated)';
};

// Generate Class Analytics
exports.generateClassAnalytics = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const submissions = await Submission.find({ assignment: assignmentId });
    const grades = await Grade.find({ assignment: assignmentId });

    // Total students for this assignment's class.
    // Backward compatible: older student accounts may not have className; treat them as class "10".
    const assignmentClass = (assignment.className || '').toString().trim();
    const normalizedAssignmentClass = normalizeClassValue(assignmentClass);
    let totalStudents = 0;
    if (assignmentClass === '10') {
      totalStudents = await User.countDocuments({
        role: 'student',
        $or: [{ className: '10' }, { className: null }, { className: { $exists: false } }],
      });
    } else {
      totalStudents = await User.countDocuments({ role: 'student', className: assignmentClass });
    }

    const submittedStudentIds = await Submission.distinct('student', { assignment: assignmentId });
    const gradedStudentIds = await Grade.distinct('student', { assignment: assignmentId });

    // Calculate analytics
    const scores = grades
      .map((g) => (typeof g.totalScore === 'number' ? g.totalScore : Number(g.totalScore)))
      .filter((s) => Number.isFinite(s));
    const scoreDistribution = {
      excellent: grades.filter(g => g.totalScore >= 90).length,
      good: grades.filter(g => g.totalScore >= 80 && g.totalScore < 90).length,
      average: grades.filter(g => g.totalScore >= 70 && g.totalScore < 80).length,
      poor: grades.filter(g => g.totalScore < 70).length,
    };

    const onTimeSubmissions = submissions.filter(s => !s.isLate).length;
    const lateSubmissions = submissions.filter(s => s.isLate).length;

    const analyticsUpdate = {
      assignment: assignmentId,
      teacher: req.userId,
      className: assignment.className,
      totalStudents,
      submittedStudents: submittedStudentIds.length,
      gradedStudents: gradedStudentIds.length,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      scoreDistribution,
      updatedAt: new Date(),
      submissionAnalysis: {
        onTimeCount: onTimeSubmissions,
        lateCount: lateSubmissions,
        averageSubmissionTime: submissions.length > 0 ? submissions.length : 0,
      },
    };

    const analytics = await Analytics.findOneAndUpdate(
      { assignment: assignmentId, teacher: req.userId },
      { $set: analyticsUpdate },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Analytics generated', analytics });
  } catch (error) {
    res.status(500).json({ message: 'Error generating analytics', error: error.message });
  }
};

// Get Assignment Analytics
exports.getAssignmentAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.findOne({ assignment: req.params.assignmentId })
      .sort({ updatedAt: -1, createdAt: -1 });
    if (!analytics) {
      return res.status(404).json({ message: 'Analytics not found' });
    }
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Get Teacher Dashboard Analytics
exports.getTeacherDashboardAnalytics = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.userId });
    const assignmentIds = assignments.map(a => a._id);

    const allGrades = await Grade.find({ assignment: { $in: assignmentIds } });
    const allSubmissions = await Submission.find({ assignment: { $in: assignmentIds } });

    const analyticsData = {
      totalAssignments: assignments.length,
      totalSubmissions: allSubmissions.length,
      totalGraded: allGrades.length,
      pendingGrading: allSubmissions.length - allGrades.length,
      averageClassScore: allGrades.length > 0 
        ? allGrades.reduce((sum, g) => sum + g.totalScore, 0) / allGrades.length 
        : 0,
      submissionRate: assignments.length > 0 
        ? (allSubmissions.length / (assignments.length * 30)) * 100 
        : 0,
    };

    res.status(200).json(analyticsData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard analytics', error: error.message });
  }
};

// Export Assignment Report (Excel)
exports.exportAssignmentReport = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate('teacher', 'firstName lastName email');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacher?._id?.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const assignmentClass = (assignment.className || '').toString().trim();
    const normalizedAssignmentClass = normalizeClassValue(assignmentClass);

    // Roster for this assignment's class.
    // Use a robust approach: fetch all students and normalize class values in JS.
    // This avoids cases where assignment class is stored as "Class 10" or students have empty/missing className.
    const allStudents = await User.find({ role: 'student' })
      .select('firstName lastName email className role')
      .sort({ firstName: 1, lastName: 1, email: 1 });

    const rosterStudents = normalizedAssignmentClass
      ? allStudents.filter((s) => {
        const normalizedStudentClass = normalizeClassValue(s.className);
        // Backward compatibility: missing/empty className treated as "10".
        const effective = normalizedStudentClass || (normalizedAssignmentClass === '10' ? '10' : '');
        return effective === normalizedAssignmentClass;
      })
      : allStudents;

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'firstName lastName email className role')
      .select('student content code submittedAt isLate');

    // Some databases may have inconsistent/missing className on users.
    // Ensure we export ALL submitted students + the class roster.
    const submittedStudentIds = submissions
      .map((s) => String(s.student?._id || s.student))
      .filter(Boolean);

    const rosterStudentIds = rosterStudents.map((s) => String(s._id));
    const allStudentIds = Array.from(new Set([...rosterStudentIds, ...submittedStudentIds]))
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const submittedStudents = allStudentIds.length
      ? await User.find({ _id: { $in: allStudentIds } })
        .select('firstName lastName email className role')
      : [];

    const studentById = new Map();
    for (const s of rosterStudents) studentById.set(String(s._id), s);
    for (const s of submittedStudents) studentById.set(String(s._id), s);

    const students = Array.from(studentById.values())
      .filter((s) => s && (s.role ? s.role === 'student' : true))
      .sort((a, b) => {
        const an = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
        const bn = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
        if (an !== bn) return an.localeCompare(bn);
        return String(a.email || '').toLowerCase().localeCompare(String(b.email || '').toLowerCase());
      });

    const grades = await Grade.find({ assignment: assignmentId })
      .select('student totalScore maxScore manualGrade autoGrade teacherFeedback gradedAt');

    const plagiarismReports = await PlagiarismReport.find({ assignment: assignmentId })
      .select('student similarityScore checkedAt isChecked');

    const submissionByStudentId = new Map();
    for (const s of submissions) {
      submissionByStudentId.set(String(s.student?._id || s.student), s);
    }

    const gradeByStudentId = new Map();
    for (const g of grades) {
      gradeByStudentId.set(String(g.student), g);
    }

    const plagiarismByStudentId = new Map();
    for (const r of plagiarismReports) {
      plagiarismByStudentId.set(String(r.student), r);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AI Assistant';
    workbook.created = new Date();

    // Put student data first so Excel opens on it by default.
    const sheet = workbook.addWorksheet('Students');
    sheet.columns = [
      { header: 'Student Name', key: 'studentName', width: 26 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Class', key: 'classLabel', width: 10 },
      { header: 'Submitted', key: 'submitted', width: 10 },
      { header: 'Submitted At', key: 'submittedAt', width: 22 },
      { header: 'Late', key: 'late', width: 8 },
      { header: 'Graded', key: 'graded', width: 8 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Max Score', key: 'maxScore', width: 10 },
      { header: 'Percentage', key: 'percentage', width: 12 },
      { header: 'Letter Grade', key: 'letterGrade', width: 12 },
      { header: 'Teacher Feedback', key: 'teacherFeedback', width: 40 },
      { header: 'Plagiarism %', key: 'plagiarism', width: 12 },
      { header: 'Answer / Content', key: 'content', width: 60 },
      { header: 'Code', key: 'code', width: 60 },
    ];

    const rows = students.map((student) => {
      const studentId = String(student._id);
      const submission = submissionByStudentId.get(studentId);
      const grade = gradeByStudentId.get(studentId);
      const plagiarism = plagiarismByStudentId.get(studentId);

      const score = grade?.totalScore;
      const maxScore = grade?.maxScore || assignment.totalPoints;
      const percentage =
        Number.isFinite(Number(score)) && Number.isFinite(Number(maxScore)) && Number(maxScore) > 0
          ? (Number(score) / Number(maxScore)) * 100
          : null;

      const displayClass = normalizeClassValue(student.className) || (normalizedAssignmentClass === '10' ? '10' : '');
      const classLabel = displayClass ? `Class ${displayClass}` : '';

      return {
        studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        email: student.email,
        classLabel,
        submitted: submission ? 'Yes' : 'No',
        submittedAt: submission?.submittedAt ? new Date(submission.submittedAt).toISOString() : '',
        late: submission ? (submission.isLate ? 'Yes' : 'No') : '',
        graded: grade ? 'Yes' : 'No',
        score: Number.isFinite(Number(score)) ? Number(score) : '',
        maxScore: Number.isFinite(Number(maxScore)) ? Number(maxScore) : '',
        percentage: percentage == null ? '' : `${percentage.toFixed(1)}%`,
        letterGrade: percentage == null ? '' : getLetterGrade(percentage),
        teacherFeedback: truncateForExcelCell(grade?.teacherFeedback || ''),
        plagiarism: plagiarism?.isChecked ? plagiarism.similarityScore : '',
        content: truncateForExcelCell(submission?.content || ''),
        code: truncateForExcelCell(submission?.code || ''),
      };
    });

    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = {
      from: 'A1',
      to: 'O1',
    };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const metaSheet = workbook.addWorksheet('Assignment');
    metaSheet.columns = [
      { header: 'Field', key: 'field', width: 22 },
      { header: 'Value', key: 'value', width: 60 },
    ];
    metaSheet.addRows([
      { field: 'Title', value: assignment.title },
      { field: 'Type', value: assignment.type },
      { field: 'Class', value: normalizedAssignmentClass ? `Class ${normalizedAssignmentClass}` : '' },
      { field: 'Total Points', value: assignment.totalPoints },
      { field: 'Due Date', value: assignment.dueDate ? new Date(assignment.dueDate).toISOString() : '' },
      {
        field: 'Teacher',
        value: `${assignment.teacher?.firstName || ''} ${assignment.teacher?.lastName || ''}`.trim() || assignment.teacher?.email || '',
      },
      { field: 'Generated At', value: new Date().toISOString() },
    ]);
    metaSheet.getRow(1).font = { bold: true };

    const filename = toSafeFilename(`${assignment.title} - Class ${normalizedAssignmentClass || ''} - Report`) + '.xlsx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const buffer = await workbook.xlsx.writeBuffer();
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    // Helpful for debugging export failures (e.g., Excel cell limits, bad data).
    // Keep this log server-side only.
    // eslint-disable-next-line no-console
    console.error('exportAssignmentReport failed:', error);
    return res.status(500).json({
      message: 'Error exporting report',
      error: error?.message || String(error),
    });
  }
};

// Get Student Performance Analytics
exports.getStudentPerformanceAnalytics = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.userId;
    const grades = await Grade.find({ student: studentId })
      .populate('assignment', 'title type')
      .sort({ gradedAt: -1 });

    const performanceData = {
      totalAssignments: grades.length,
      averageScore: grades.length > 0 
        ? grades.reduce((sum, g) => sum + g.totalScore, 0) / grades.length 
        : 0,
      improvementTrend: calculateTrend(grades),
      strengthAreas: identifyStrengths(grades),
      improvementAreas: identifyWeaknesses(grades),
    };

    res.status(200).json(performanceData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance analytics', error: error.message });
  }
};

// Helper functions
function calculateTrend(grades) {
  if (grades.length < 2) return 0;
  const recent = grades.slice(0, 5);
  const older = grades.length > 5 ? grades.slice(5, 10) : grades;
  const recentAvg = recent.reduce((sum, g) => sum + g.totalScore, 0) / recent.length;
  const olderAvg = older.reduce((sum, g) => sum + g.totalScore, 0) / older.length;
  return ((recentAvg - olderAvg) / olderAvg) * 100;
}

function identifyStrengths(grades) {
  const typeScores = {};
  grades.forEach(g => {
    if (!typeScores[g.assignment?.type]) {
      typeScores[g.assignment?.type] = [];
    }
    typeScores[g.assignment?.type].push(g.totalScore);
  });

  const averages = Object.entries(typeScores).map(([type, scores]) => ({
    type,
    average: scores.reduce((a, b) => a + b) / scores.length,
  }));

  return averages.filter(a => a.average >= 80).map(a => a.type);
}

function identifyWeaknesses(grades) {
  const typeScores = {};
  grades.forEach(g => {
    if (!typeScores[g.assignment?.type]) {
      typeScores[g.assignment?.type] = [];
    }
    typeScores[g.assignment?.type].push(g.totalScore);
  });

  const averages = Object.entries(typeScores).map(([type, scores]) => ({
    type,
    average: scores.reduce((a, b) => a + b) / scores.length,
  }));

  return averages.filter(a => a.average < 75).map(a => a.type);
}

// Analysis with Learning Outcomes
exports.analyzeLearningOutcomes = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    const grades = await Grade.find({ assignment: assignmentId }).populate('submission');

    if (!grades.length) {
      return res.status(400).json({ message: 'No grades available for analysis' });
    }

    const analysisResult = await aiService.analyzeLearningOutcomes(
      grades.map(g => ({ score: g.totalScore, feedback: g.aiGeneratedFeedback })),
      [assignment]
    );

    res.status(200).json({ analysis: analysisResult });
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing learning outcomes', error: error.message });
  }
};
