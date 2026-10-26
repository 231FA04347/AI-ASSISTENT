import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI, analyticsAPI } from '../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiLogOut, FiBarChart2, FiBook, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import QuizBuilder from '../components/QuizBuilder';
import ProgrammingAssignmentBuilder from '../components/ProgrammingAssignmentBuilder';
import QuestionGenerator from '../components/QuestionGenerator';

const TeacherDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignmentSubmissions, setSelectedAssignmentSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'quiz',
    className: '',
    dueDate: '',
    totalPoints: 100,
    content: '',
    quizQuestions: [],
    programmingLanguages: ['python'],
    question: '',
    visibleTestCases: [],
    hiddenTestCases: [],
    difficulty: 'easy',
  });
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
    fetchDashboardAnalytics();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentAPI.getTeacherAssignments();
      setAssignments(response.data);
    } catch (error) {
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardAnalytics = async () => {
    try {
      const response = await analyticsAPI.getDashboardAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.log('Analytics not available yet');
    }
  };

  const fetchAssignmentSubmissions = async (assignmentId) => {
    try {
      const response = await assignmentAPI.getAssignmentSubmissions(assignmentId);
      setSubmissions(prev => ({
        ...prev,
        [assignmentId]: response.data
      }));
    } catch (error) {
      toast.error('Failed to fetch submissions');
    }
  };

  const handleViewSubmissions = (assignmentId) => {
    setSelectedAssignmentSubmissions(assignmentId);
    fetchAssignmentSubmissions(assignmentId);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await assignmentAPI.createAssignment(formData);
      toast.success('Assignment created successfully');
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'quiz',
        className: '',
        dueDate: '',
        totalPoints: 100,
        content: '',
        quizQuestions: [],
        programmingLanguages: ['python'],
        question: '',
        visibleTestCases: [],
        hiddenTestCases: [],
      });
      fetchAssignments();
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create assignment';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await assignmentAPI.deleteAssignment(id);
        toast.success('Assignment deleted');
        fetchAssignments();
      } catch (error) {
        toast.error('Failed to delete assignment');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-200 transition"
            >
              <FiUser /> Profile
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalAssignments}</p>
                </div>
                <FiBook className="text-blue-600 text-3xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalSubmissions}</p>
                </div>
                <FiBarChart2 className="text-green-600 text-3xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending Grading</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.pendingGrading}</p>
                </div>
                <FiBarChart2 className="text-orange-600 text-3xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageClassScore.toFixed(1)}%</p>
                </div>
                <FiBarChart2 className="text-purple-600 text-3xl" />
              </div>
            </div>
          </div>
        )}

        {/* Create Assignment Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            <FiPlus /> Create New Assignment
          </button>
        </div>

        {/* Create Assignment Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Assignment</h2>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-gray-700 font-semibold mb-2">Difficulty</label>
                                  <select
                                    value={formData.difficulty}
                                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                                    required
                                  >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                  </select>
                                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setFormData((prev) => {
                        const next = { ...prev, type: nextType };
                        if (nextType === 'programming') {
                          next.description = '';
                          next.content = '';
                        }
                        return next;
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                  >
                    <option value="quiz">Quiz</option>
                    <option value="programming">Programming</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Class</label>
                  <input
                    type="number"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: String(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    min={1}
                    max={12}
                    placeholder="10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Total Points</label>
                  <input
                    type="number"
                    value={formData.totalPoints}
                    onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>
              {formData.type !== 'programming' && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    rows="3"
                    required
                  />
                </div>
              )}
              {formData.type !== 'programming' && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    rows="4"
                    required
                  />
                </div>
              )}

              {/* Quiz Builder for Quiz Type */}
              {formData.type === 'quiz' && (
                <QuizBuilder 
                  quiz={formData.quizQuestions} 
                  onQuizChange={(questions) => setFormData({ ...formData, quizQuestions: questions })}
                />
              )}

              {/* Programming Assignment Builder for Programming Type */}
              {formData.type === 'programming' && (
                <ProgrammingAssignmentBuilder 
                  assignment={formData}
                  onAssignmentChange={setFormData}
                />
              )}

              <div className="flex gap-4">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                  Create Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Question Generator Section */}
        <QuestionGenerator />

        {/* Assignments List */}
        <div className="grid grid-cols-1 gap-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Assignments</h2>
          {loading ? (
            <p className="text-gray-600">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="text-gray-600">No assignments yet. Create one to get started!</p>
          ) : (
            assignments.map(assignment => (
              <div key={assignment._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-gray-600 mt-1">{assignment.description}</p>
                    <div className="flex gap-4 mt-3 text-sm text-gray-600 items-center">
                      <span>Type: <strong>{assignment.type}</strong></span>
                      <span>Class <strong>{assignment.className}</strong></span>
                      <span>Points: <strong>{assignment.totalPoints}</strong></span>
                      <span>Due: <strong>{new Date(assignment.dueDate).toLocaleDateString()}</strong></span>
                      {assignment.difficulty && (
                        <span className={`inline-block px-2 py-1 rounded text-white font-semibold text-xs 
                          ${assignment.difficulty === 'easy' ? 'bg-green-500' : assignment.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`}
                        >
                          {assignment.difficulty.charAt(0).toUpperCase() + assignment.difficulty.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewSubmissions(assignment._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <FiBook /> Submissions
                    </button>
                    <button
                      onClick={() => navigate(`/grading/${assignment._id}`)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <FiBarChart2 /> Grade
                    </button>
                    <button
                      onClick={() => navigate(`/analytics/${assignment._id}`)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <FiBarChart2 /> Analytics
                    </button>
                    <button
                      onClick={() => handleDelete(assignment._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Submissions Modal */}
        {selectedAssignmentSubmissions && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Submissions & Scores
                </h2>
                <button
                  onClick={() => setSelectedAssignmentSubmissions(null)}
                  className="text-gray-600 hover:text-gray-900 text-2xl"
                >
                  ×
                </button>
              </div>

              {submissions[selectedAssignmentSubmissions]?.length === 0 ? (
                <p className="text-gray-600 py-4">No submissions yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Student</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Submitted</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Score</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Status</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions[selectedAssignmentSubmissions]?.map(submission => {
                        const grade = submission.grade || {};
                        const scorePercentage = grade.maxScore ? ((grade.autoGrade || grade.totalScore || 0) / grade.maxScore) * 100 : 0;
                        const getLetterGrade = (percent) => {
                          if (percent >= 90) return 'A';
                          if (percent >= 80) return 'B';
                          if (percent >= 70) return 'C';
                          if (percent >= 60) return 'D';
                          return 'F';
                        };
                        const letterGrade = getLetterGrade(scorePercentage);

                        return (
                          <tr key={submission._id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900">{submission.student?.firstName} {submission.student?.lastName}</td>
                            <td className="px-4 py-2 text-gray-600">
                              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-2">
                              <span className="font-semibold text-blue-600">
                                {grade?.autoGrade || grade?.totalScore || 0} / {grade?.maxScore || 0}
                              </span>
                              <span className="text-gray-600 ml-2">({scorePercentage.toFixed(1)}%)</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                submission.isLate ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {submission.isLate ? 'Late' : 'On time'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="font-bold text-lg">{letterGrade}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
