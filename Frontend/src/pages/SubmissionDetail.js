import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionAPI, gradeAPI } from '../utils/api';
import { FiArrowLeft, FiDownload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const getLetterGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 65) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [grade, setGrade] = useState(null);
  const [plagiarismReport, setPlagiarismReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false);
  const [gradeFormData, setGradeFormData] = useState({
    score: 0,
    feedback: '',
  });

  useEffect(() => {
    fetchSubmissionDetails();
  }, [id]);

  const fetchSubmissionDetails = async () => {
    try {
      const submissionResponse = await submissionAPI.getSubmission(id);
      setSubmission(submissionResponse.data);

      try {
        const gradeResponse = await gradeAPI.getGrade(submissionResponse.data._id);
        setGrade(gradeResponse.data);
        setGradeFormData({
          score: gradeResponse.data.manualGrade || gradeResponse.data.autoGrade || 0,
          feedback: gradeResponse.data.teacherFeedback || '',
        });
      } catch (error) {
        console.log('No grade yet');
      }

      try {
        const plagiarismResponse = await submissionAPI.getPlagiarismReport(id);
        setPlagiarismReport(plagiarismResponse.data);
      } catch (error) {
        console.log('No plagiarism report');
      }
    } catch (error) {
      toast.error('Failed to fetch submission');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPlagiarism = async () => {
    setCheckingPlagiarism(true);
    try {
      await submissionAPI.checkPlagiarism(id);
      toast.success('Plagiarism check completed');
      fetchSubmissionDetails();
    } catch (error) {
      toast.error('Failed to check plagiarism');
    } finally {
      setCheckingPlagiarism(false);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      await gradeAPI.gradeSubmission({
        submissionId: id,
        score: gradeFormData.score,
        feedback: gradeFormData.feedback,
      });
      toast.success('Submission graded successfully');
      fetchSubmissionDetails();
    } catch (error) {
      toast.error('Failed to grade submission');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!submission) {
    return <div className="flex items-center justify-center min-h-screen">Submission not found</div>;
  }

  const assignmentType = submission.assignment?.type;
  const isEssaySubmission = assignmentType === 'essay';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <FiArrowLeft /> Back
        </button>

        {/* Submission Info */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Submission by {submission.student?.firstName} {submission.student?.lastName}
              </h1>
              <p className="text-gray-600 mt-2">

              {/* Essay Answer */}
              {isEssaySubmission && submission.content && (
                <div className="border-t pt-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Submitted Answer</h2>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap text-gray-900">
                    {submission.content}
                  </div>
                </div>
              )}

                Submitted on {new Date(submission.submittedAt).toLocaleString()}
                {submission.isLate && <span className="text-red-600 ml-2">(Late)</span>}
              </p>
            </div>
            {grade && (
              <div className="text-right">
                <p className="text-gray-600 text-sm">Score</p>
                <p className="text-3xl font-bold text-green-600 mb-3">{grade.totalScore} / {grade.maxScore}</p>
                <p className="text-gray-600 text-sm">Percentage</p>
                <p className="text-2xl font-bold text-blue-600 mb-3">{((grade.totalScore / grade.maxScore) * 100).toFixed(1)}%</p>
                <p className="text-gray-600 text-sm">Grade</p>
                <p className="text-4xl font-bold text-purple-600">{getLetterGrade((grade.totalScore / grade.maxScore) * 100)}</p>
              </div>
            )}
          </div>



          {/* Code (if applicable) */}
          {submission.code && (
            <div className="border-t pt-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Code</h2>
              <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-green-400 font-mono text-sm">{submission.code}</pre>
              </div>
            </div>
          )}

          {/* Plagiarism Report */}
          <div className="border-t pt-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Plagiarism Check</h2>
              {!plagiarismReport && (
                <button
                  onClick={handleCheckPlagiarism}
                  disabled={checkingPlagiarism}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
                >
                  {checkingPlagiarism ? 'Checking...' : 'Check Plagiarism'}
                </button>
              )}
            </div>

            {plagiarismReport ? (
              <div className={`p-4 rounded-lg ${plagiarismReport.similarityScore > 30 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <p className={`text-lg font-semibold ${plagiarismReport.similarityScore > 30 ? 'text-red-900' : 'text-green-900'}`}>
                  Similarity Score: {plagiarismReport.similarityScore}%
                </p>
                {plagiarismReport.report && (
                  <p className="text-gray-700 mt-2 whitespace-pre-wrap">{plagiarismReport.report}</p>
                )}

                {Array.isArray(plagiarismReport.matchedSubmissions) && plagiarismReport.matchedSubmissions.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Top Matches</h3>
                    <div className="space-y-2">
                      {plagiarismReport.matchedSubmissions.map((m) => (
                        <div key={m.submissionId} className="bg-white border border-gray-200 rounded p-3">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-gray-900 font-medium">{m.studentName || 'Unknown'}</p>
                            <p className="text-gray-700">{m.similarityPercentage}%</p>
                          </div>
                          {Array.isArray(m.matchedSections) && m.matchedSections.length > 0 && (
                            <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                              {m.matchedSections.slice(0, 3).map((s, idx) => (
                                <div key={idx}>- {s}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">No plagiarism check performed yet.</p>
            )}
          </div>

          {/* Grading Form */}
          {!grade || grade.status === 'submitted' ? (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Grade This Submission</h2>
              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Score</label>
                  <input
                    type="number"
                    value={gradeFormData.score}
                    onChange={(e) => setGradeFormData({ ...gradeFormData, score: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Feedback</label>
                  <textarea
                    value={gradeFormData.feedback}
                    onChange={(e) => setGradeFormData({ ...gradeFormData, feedback: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    rows="6"
                    placeholder="Provide feedback for the student..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Submit Grade
                </button>
              </form>
            </div>
          ) : (
            <div className="border-t pt-6 bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FiCheckCircle className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-green-900">Grading Complete</h3>
              </div>
              {grade.teacherFeedback && (
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Feedback</h4>
                  <p className="text-gray-700 bg-white p-3 rounded whitespace-pre-wrap">{grade.teacherFeedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
