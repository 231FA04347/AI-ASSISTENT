import React, { useState } from 'react';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StudentQuizTaker = ({ assignment, onSubmit }) => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelectAnswer = (questionId, optionIdx) => {
    setAnswers({
      ...answers,
      [questionId]: optionIdx
    });
  };

  const handleSubmitQuiz = () => {
    const quizQuestions = assignment.quizQuestions || [];
    
    if (Object.keys(answers).length !== quizQuestions.length) {
      toast.error('Please answer all questions before submitting!');
      return;
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    quizQuestions.forEach((question, idx) => {
      totalPoints += question.points || 1;
      if (answers[idx] === question.correctAnswer) {
        earnedPoints += question.points || 1;
      }
    });

    const percentage = (earnedPoints / totalPoints) * 100;
    setScore(percentage.toFixed(2));
    setSubmitted(true);

    // Call parent onSubmit with answers and score
    onSubmit({
      answers,
      score: earnedPoints,
      totalPoints,
      percentage: parseFloat(percentage.toFixed(2))
    });

    toast.success(`Quiz submitted! You scored ${percentage.toFixed(1)}%`);
  };

  const quizQuestions = assignment.quizQuestions || [];

  if (quizQuestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">This quiz has no questions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
        >
          <FiArrowLeft /> Back
        </button>
        <h2 className="text-2xl font-bold">Quiz: {assignment.title}</h2>
        <div className="text-right">
          {submitted && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
              <p className="text-green-800 font-bold text-lg">{score}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quizQuestions.map((question, questionIdx) => (
          <div key={questionIdx} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Q{questionIdx + 1}: {question.question}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Points: {question.points || 1}</p>
            </div>

            <div className="space-y-3">
              {question.options.map((option, optionIdx) => (
                <label
                  key={optionIdx}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    answers[questionIdx] === optionIdx
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  } ${
                    submitted &&
                    optionIdx === question.correctAnswer &&
                    'bg-green-50 border-green-500'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${questionIdx}`}
                    value={optionIdx}
                    checked={answers[questionIdx] === optionIdx}
                    onChange={() => handleSelectAnswer(questionIdx, optionIdx)}
                    disabled={submitted}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="ml-3 text-gray-700">
                    {String.fromCharCode(65 + optionIdx)}) {option}
                  </span>
                  {submitted && optionIdx === question.correctAnswer && (
                    <span className="ml-auto text-green-600">
                      <FiCheck size={20} />
                    </span>
                  )}
                  {submitted &&
                    answers[questionIdx] === optionIdx &&
                    optionIdx !== question.correctAnswer && (
                      <span className="ml-auto text-red-600 font-bold">✗</span>
                    )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <button
          onClick={handleSubmitQuiz}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition text-center"
        >
          Submit Quiz
        </button>
      )}

      {/* Score Display */}
      {submitted && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Submitted!</h2>
          <p className="text-4xl font-bold text-blue-600 mb-2">{score}%</p>
          <p className="text-gray-600">
            Your answers have been automatically graded. Check your grades in the dashboard.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentQuizTaker;
