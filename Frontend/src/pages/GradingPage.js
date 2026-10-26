import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI, gradeAPI } from '../utils/api';
import { FiArrowLeft, FiEdit2, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const getLetterGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 65) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

const getGradeColor = (percentage) => {
  if (percentage >= 90) return 'bg-green-100 text-green-800';
  if (percentage >= 80) return 'bg-blue-100 text-blue-800';
  if (percentage >= 65) return 'bg-yellow-100 text-yellow-800';
  if (percentage >= 50) return 'bg-orange-100 text-orange-800';
  if (percentage >= 35) return 'bg-red-100 text-red-800';
  return 'bg-red-200 text-red-900';
};

const GradingPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradeData, setGradeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [gradeFormData, setGradeFormData] = useState({ score: 0, feedback: '' });

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      const assignmentResponse = await assignmentAPI.getAssignment(assignmentId);
      setAssignment(assignmentResponse.data);

      const submissionsResponse = await assignmentAPI.getAssignmentSubmissions(assignmentId);
      setSubmissions(submissionsResponse.data);

      const gradesResponse = await gradeAPI.getClassGrades(assignmentId);
      setGradeData(gradesResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubmission = (submissionId) => {
    navigate(`/submission/${submissionId}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!assignment) {
    return <div className="flex items-center justify-center min-h-screen">Assignment not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <FiArrowLeft /> Back
        </button>

        {/* Assignment Title */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-600 mt-2">Total Points: {assignment.totalPoints}</p>
        </div>

        {/* Statistics */}
        {gradeData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{gradeData.stats.count}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Average Score</p>
              <p className="text-2xl font-bold text-blue-600">{gradeData.stats.average.toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Highest Score</p>
              <p className="text-2xl font-bold text-green-600">{gradeData.stats.highest}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Lowest Score</p>
              <p className="text-2xl font-bold text-orange-600">{gradeData.stats.lowest}</p>
            </div>
          </div>
        )}

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Student Submissions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Submitted</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Grade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-600">
                      No submissions yet
                    </td>
                  </tr>
                ) : (
                  submissions.map(submission => {
                    const submissionGrade = gradeData?.grades.find(g => g.submission?._id === submission._id);
                    const percentage = submissionGrade ? (submissionGrade.totalScore / submissionGrade.maxScore) * 100 : 0;
                    return (
                      <tr key={submission._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {submission.student?.firstName} {submission.student?.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {submission.student?.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            submission.isLate ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {submission.isLate ? 'Late' : 'On Time'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {submissionGrade ? (
                            <div>
                              <p>{submissionGrade.totalScore} / {submissionGrade.maxScore}</p>
                              <p className="text-xs text-gray-600">({percentage.toFixed(1)}%)</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">Not graded</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {submissionGrade ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getGradeColor(percentage)}`}>
                              {getLetterGrade(percentage)}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleSelectSubmission(submission._id)}
                            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                          >
                            <FiEdit2 size={16} /> Grade
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingPage;
