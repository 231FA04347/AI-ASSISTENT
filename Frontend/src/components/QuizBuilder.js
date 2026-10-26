
import React, { useState, useRef } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const QuizBuilder = ({ quiz = [], onQuizChange }) => {
  // Matches: 1. Question\nA) ...\nB) ...\nC) ...\nD) ...
  const mcqRegex = /(\d+\.\s*.+?)\s*A\)(.+?)\s*B\)(.+?)\s*C\)(.+?)\s*D\)(.+?)(?=\n?\d+\.|$)/gs;

  // PDF MCQ extraction logic
  const fileInputRef = useRef();
  const handlePdfUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8001/extract-mcqs/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to extract questions from PDF');
    const data = await response.json();

    if (!data.questions || !data.questions.length) throw new Error('No MCQs found or invalid format.');

    // Detect correct answer from answer annotation in options
    const newQuestions = data.questions.map((q, idx) => {
      let correctAnswer = 0;
      const cleanedOptions = q.options.map((opt, i) => {
        const match = opt.match(/Answer:\s*([A-D])/i);
        if (match) {
          correctAnswer = match[1].charCodeAt(0) - 65;
          return opt.replace(/\n?Answer:.*$/, '').trim();
        }
        return opt.trim();
      });
      return {
        question: q.question,
        options: cleanedOptions,
        correctAnswer,
        points: 1,
        id: Date.now() + Math.random() + idx
      };
    });

    onQuizChange([...quiz, ...newQuestions]);
    toast.success(`${newQuestions.length} questions added from PDF!`);
  } catch (err) {
    toast.error(err.message || 'Failed to extract questions from PDF');
  }
};
  async function extractTextFromPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  }

  function parseMCQs(text) {
    const matches = [...text.matchAll(mcqRegex)];
    return matches.map(match => {
      // match[1]: question, match[2]: A), match[3]: B), match[4]: C), match[5]: D)
      const question = match[1].replace(/^\d+\.\s*/, '').replace(/\n/g, ' ').trim();
      const options = {
        A: match[2].replace(/^A\)\s*/, '').replace(/\n/g, ' ').trim(),
        B: match[3].replace(/^B\)\s*/, '').replace(/\n/g, ' ').trim(),
        C: match[4].replace(/^C\)\s*/, '').replace(/\n/g, ' ').trim(),
        D: match[5].replace(/^D\)\s*/, '').replace(/\n/g, ' ').trim(),
      };
      return { question, options };
    });
  }
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1
  });

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (currentQuestion.options.some(opt => !opt.trim())) {
      toast.error('All options must be filled');
      return;
    }
    onQuizChange([...quiz, { ...currentQuestion, id: Date.now() }]);
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1
    });
    setShowAddQuestion(false);
    toast.success('Question added!');
  };

  const deleteQuestion = (id) => {
    onQuizChange(quiz.filter(q => q.id !== id));
    toast.success('Question removed');
  };

  const updateOption = (index, value) => {
    const options = [...currentQuestion.options];
    options[index] = value;
    setCurrentQuestion({ ...currentQuestion, options });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">Quiz Questions ({quiz.length})</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handlePdfUpload}
          />
          <button
            type="button"
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition cursor-pointer border border-blue-200 ml-2 text-sm font-medium"
            onClick={() => {
              console.log('fileInputRef.current:', fileInputRef.current);
              if (fileInputRef.current) fileInputRef.current.click();
            }}
          >
            Upload PDF
          </button>
          {/* Fallback: always show a visible input for debugging */}
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            className="ml-2"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAddQuestion(!showAddQuestion)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <FiPlus /> Add Question
        </button>
      </div>

      {/* Add Question Form */}
      {showAddQuestion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Question Text *</label>
              <textarea
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                rows="2"
                placeholder="Enter your question here..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => (
                <div key={idx}>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Option {String.fromCharCode(65 + idx)} {idx === currentQuestion.correctAnswer && <span className="text-green-600">✓ Correct</span>}
                  </label>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: idx })}
                    className={`mt-2 w-full py-1 rounded text-sm font-semibold transition ${
                      idx === currentQuestion.correctAnswer
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                    }`}
                  >
                    {idx === currentQuestion.correctAnswer ? '✓ Marked Correct' : 'Mark as Correct'}
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Points for this question</label>
              <input
                type="number"
                min="1"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={addQuestion}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Add Question
              </button>
              <button
                type="button"
                onClick={() => setShowAddQuestion(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {quiz.length === 0 && !showAddQuestion && (
          <p className="text-gray-500 text-center py-4">No questions yet. Create your first question!</p>
        )}
        {quiz.map((q, idx) => (
          <div key={q.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Q{idx + 1}: {q.question}</p>
                <div className="mt-2 space-y-1">
                  {q.options.map((option, optIdx) => (
                    <div key={optIdx} className={`text-sm px-3 py-1 rounded ${
                      optIdx === q.correctAnswer
                        ? 'bg-green-100 text-green-800 font-semibold'
                        : 'text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}) {option} {optIdx === q.correctAnswer && '✓'}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Points: {q.points}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteQuestion(q.id)}
                className="text-red-600 hover:text-red-700 transition ml-4"
              >
                <FiTrash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizBuilder;
