import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI, submissionAPI, gradeAPI } from '../utils/api';
import { FiArrowLeft, FiSend, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import StudentQuizTaker from '../components/StudentQuizTaker';
import QuizReview from '../components/QuizReview';
import ProgrammingEditor from '../components/ProgrammingEditor';
import FullScreenAssignmentMode from '../components/FullScreenAssignmentMode';

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionCode, setSubmissionCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [grade, setGrade] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isFullScreenMode, setIsFullScreenMode] = useState(false);

  useEffect(() => {
    fetchAssignment();
    fetchSubmission();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const response = await assignmentAPI.getAssignment(id);
      setAssignment(response.data);
    } catch (error) {
      toast.error('Failed to fetch assignment');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmission = async () => {
    try {
      const response = await submissionAPI.getStudentSubmissions();
      const mySubmission = response.data.find(s => s.assignment === id);
      if (mySubmission) {
        setSubmission(mySubmission);
        setSubmissionContent(mySubmission.content);
        setSubmissionCode(mySubmission.code || '');
        
        // Fetch grade if exists
        const gradeResponse = await gradeAPI.getGrade(mySubmission._id);
        setGrade(gradeResponse.data);
      }
    } catch (error) {
      console.log('No submission found');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate programming assignment requirements
      if (assignment.type === 'programming') {
        if (!submissionCode.trim()) {
          toast.error('Please write your code');
          setSubmitting(false);
          return;
        }

        if (!submissionContent.trim()) {
          toast.error('Please provide an explanation or notes');
          setSubmitting(false);
          return;
        }
      } else if (!submissionContent.trim()) {
        toast.error('Please fill in the required fields');
        setSubmitting(false);
        return;
      }

      // Submit based on assignment type
      const submissionData = {
        assignmentId: id,
        content: submissionContent,
      };

      if (assignment.type === 'programming') {
        submissionData.code = submissionCode;
        submissionData.language = assignment.language || 'javascript';
      }

      await submissionAPI.submitAssignment(submissionData);

      toast.success('Assignment submitted successfully!');
      fetchSubmission();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const requestAIFeedback = async () => {
    setAiLoading(true);
    try {
      await submissionAPI.requestAIFeedback(submission._id);
      toast.success('AI feedback requested! Please refresh in a moment.');
      setTimeout(fetchSubmission, 2000);
    } catch (error) {
      toast.error('Failed to request AI feedback');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!assignment) {
    return <div className="flex items-center justify-center min-h-screen">Assignment not found</div>;
  }

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

        {/* Display Grade if Available */}
          {grade && (
            <div className="border-t mt-6 pt-6 bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Your Grade</h3>
              
              {/* Quiz Review */}
              {assignment.type === 'quiz' && submission ? (
                <QuizReview 
                  assignment={assignment} 
                  submission={submission} 
                  grade={grade}
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-green-600 text-sm">Score</p>
                      <p className="text-2xl font-bold text-green-900">{grade.totalScore} / {grade.maxScore}</p>
                    </div>
                    <div>
                      <p className="text-green-600 text-sm">Percentage</p>
                      <p className="text-2xl font-bold text-green-900">{((grade.totalScore / grade.maxScore) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  {grade.teacherFeedback && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-green-900 mb-2">Teacher Feedback</h4>
                      <p className="text-gray-700 bg-white p-3 rounded">{grade.teacherFeedback}</p>
                    </div>
                  )}
                  
                  {grade.aiGeneratedFeedback && (
                    <div>
                      <h4 className="font-semibold text-green-900 mb-2">AI Feedback</h4>
                      <p className="text-gray-700 bg-white p-3 rounded whitespace-pre-wrap">{grade.aiGeneratedFeedback}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}


        {/* Submission Form */}
        {/* Show FullScreenAssignmentMode if in fullscreen mode and not completed */}
        {isFullScreenMode && assignment.type === 'programming' && (!submission || submission.status !== 'submitted') ? (
          <FullScreenAssignmentMode
            assignment={assignment}
            onSubmit={async (result) => {
              try {
                setSubmitting(true);
                // If endTest is true, mark submission as complete
                if (result.endTest) {
                  const submissions = await submissionAPI.getStudentSubmissions();
                  const mySubmission = submissions.data.find(s => s.assignment === id);
                  if (mySubmission) {
                    await submissionAPI.endTestForSubmission(mySubmission._id);
                    toast.success('Test ended and marked as complete!');
                    setIsFullScreenMode(false);
                    await fetchSubmission();
                    return;
                  } else {
                    toast.error('No submission found to end test');
                    return;
                  }
                }
                // Otherwise, normal submit
                await submissionAPI.submitAssignment({
                  assignmentId: id,
                  content: result.explanation || '',
                  code: result.code,
                  language: result.language,
                });
                const submissions = await submissionAPI.getStudentSubmissions();
                const newSubmission = submissions.data.find(s => s.assignment === id);
                if (newSubmission) {
                  const gradeResponse = await fetch('/api/code-execution/grade-submission', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                      code: result.code,
                      language: result.language,
                      assignmentId: id,
                      submissionId: newSubmission._id,
                    }),
                  });
                  const gradeData = await gradeResponse.json();
                  if (gradeData.success) {
                    toast.success('Assignment submitted and graded!');
                    setIsFullScreenMode(false);
                    await fetchSubmission();
                  } else {
                    toast.error('Failed to grade submission');
                  }
                }
              } catch (error) {
                toast.error('Failed to submit assignment');
              } finally {
                setSubmitting(false);
              }
            }}
            onExit={() => setIsFullScreenMode(false)}
          />
        ) : null}

        {/* If assignment is completed, show completed message */}
        {submission && submission.status === 'submitted' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-green-900 mb-2">Assignment Completed</h3>
            <p className="text-green-700">You have completed this assignment.</p>
          </div>
        ) : null}

        {/* Show start assignment button if not started or not completed */}
        {!isFullScreenMode && assignment.type === 'programming' && (!submission || submission.status !== 'submitted') ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">📚 Start Assignment</h3>
              <p className="text-blue-800 mb-4">
                Click the button below to enter full-screen mode and start solving this programming assignment.
              </p>
              <p className="text-sm text-blue-700 mb-4">
                <strong>Note:</strong> You can exit full-screen 2 times. On the 3rd attempt, your code will be submitted automatically.
              </p>
              <button
                type="button"
                onClick={() => setIsFullScreenMode(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                🖥️ Enter Full-Screen Mode
              </button>
            </div>
          </div>
        ) : null}

        {/* Quiz and essay/other assignment types remain unchanged */}
        {assignment.type === 'quiz' && !submission ? (
          <StudentQuizTaker 
            assignment={assignment}
            onSubmit={async (quizResult) => {
              try {
                await submissionAPI.submitAssignment({
                  assignmentId: id,
                  content: JSON.stringify(quizResult),
                  quizAnswers: quizResult.answers,
                  score: quizResult.score,
                  totalPoints: quizResult.totalPoints,
                  percentage: quizResult.percentage,
                });
                const submissions = await submissionAPI.getStudentSubmissions();
                const newSubmission = submissions.data.find(s => s.assignment === id);
                if (newSubmission) {
                  await gradeAPI.gradeSubmission({
                    submissionId: newSubmission._id,
                    autoGrade: quizResult.score,
                    totalScore: quizResult.totalPoints,
                    aiGeneratedFeedback: `Quiz completed! You scored ${quizResult.percentage}%`
                  });
                }
                setTimeout(fetchSubmission, 1000);
              } catch (error) {
                toast.error('Failed to submit quiz');
              }
            }}
          />
        ) : null}

        {/* Essay/other assignment types */}
        {assignment.type !== 'programming' && assignment.type !== 'quiz' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-3">Your Answer</label>
              <textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600"
                rows="10"
                placeholder="Enter your submission here..."
                required
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition"
              >
                <FiSend /> {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
              {submission && (
                <button
                  type="button"
                  onClick={requestAIFeedback}
                  disabled={aiLoading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition"
                >
                  <FiZap /> {aiLoading ? 'Analyzing...' : 'Get AI Feedback'}
                </button>
              )}
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default AssignmentDetail;
