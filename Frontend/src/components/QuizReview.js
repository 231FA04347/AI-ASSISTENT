import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

const QuizReview = ({ assignment, submission, grade }) => {
  const quizQuestions = assignment.quizQuestions || [];
  let studentAnswers = {};

  // Try to parse the submission content if it's JSON
  try {
    if (submission.content && typeof submission.content === 'string') {
      const parsed = JSON.parse(submission.content);
      studentAnswers = parsed.answers || {};
    }
  } catch (e) {
    console.log('Could not parse quiz answers');
  }

  if (quizQuestions.length === 0) {
    return <p className="text-gray-600">Quiz has no questions.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-lg font-semibold text-blue-900">
          Score: {grade?.autoGrade || 0} / {grade?.totalScore || 0} points
          {grade?.totalScore > 0 && (
            <span className="ml-2 text-green-600 font-bold">
              ({Math.round((grade?.autoGrade / grade?.totalScore) * 100)}%)
            </span>
          )}
        </p>
      </div>

      {quizQuestions.map((question, questionIdx) => (
        <div key={questionIdx} className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">
            Q{questionIdx + 1}: {question.question}
          </h3>

          <div className="space-y-2">
            {question.options.map((option, optionIdx) => {
              const isSelectedByStudent = studentAnswers[questionIdx] === optionIdx;
              const isCorrect = optionIdx === question.correctAnswer;
              const studentGotItRight = isSelectedByStudent && isCorrect;

              return (
                <div
                  key={optionIdx}
                  className={`flex items-center p-3 border rounded-lg ${
                    isCorrect
                      ? 'bg-green-50 border-green-300'
                      : isSelectedByStudent && !isCorrect
                      ? 'bg-red-50 border-red-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 font-semibold ${
                      isCorrect
                        ? 'bg-green-600 text-white'
                        : isSelectedByStudent
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-300 text-white'
                    }`}
                  >
                    {String.fromCharCode(65 + optionIdx)}
                  </span>

                  <span className="flex-1 text-gray-700">{option}</span>

                  {isCorrect && (
                    <span className="ml-auto text-green-600 font-semibold flex items-center gap-1">
                      <FiCheck size={18} /> Correct Answer
                    </span>
                  )}

                  {isSelectedByStudent && !isCorrect && (
                    <span className="ml-auto text-red-600 font-semibold flex items-center gap-1">
                      <FiX size={18} /> Your Answer
                    </span>
                  )}

                  {studentGotItRight && (
                    <span className="ml-auto text-green-600 font-bold">✓ Correct!</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-sm text-gray-500 mt-2">Points: {question.points || 1}</p>
        </div>
      ))}
    </div>
  );
};

export default QuizReview;
