import React, { useState } from 'react';

const QuestionGenerator = ({ onQuestionsGenerated }) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [className, setClassName] = useState('');
  const [topics, setTopics] = useState('');
  const [numQuestions, setNumQuestions] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState([]);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setGenerated([]);
    try {
      const response = await fetch('http://localhost:8000/generate-questions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics, num_questions: numQuestions }),
      });
      if (!response.ok) throw new Error('Failed to generate questions');
      const data = await response.json();
      setGenerated(data.questions);
      if (onQuestionsGenerated) onQuestionsGenerated(data.questions);
    } catch (err) {
      setError(err.message || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Dashboard Button */}
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold mb-6"
        onClick={() => setShowModal(true)}
      >
        Generate Questions
      </button>

      {/* Modal for Question Generation */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <h2 className="font-bold text-xl mb-4">Generate Scenario-Based Questions</h2>
            <div className="mb-3">
              <label className="block text-gray-700 font-semibold mb-1">Title</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter title for this set"
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 font-semibold mb-1">Class</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="Enter class (e.g., 10)"
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 font-semibold mb-1">Topics</label>
              <textarea
                className="w-full border p-2 rounded mb-2"
                rows={3}
                placeholder="Enter topics, separated by commas or newlines"
                value={topics}
                onChange={e => setTopics(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 font-semibold mb-1">Number of Questions</label>
              <input
                type="number"
                min={1}
                className="w-full border p-2 rounded mb-2"
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                placeholder="Number of questions"
              />
            </div>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded w-full font-semibold mt-2"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            {/* Show generated questions below the button */}
            <div className="mt-6 max-h-80 overflow-y-auto">
              {generated.map((q, idx) => (
                <div key={idx} className="mb-4 border-b pb-2">
                  <div className="font-semibold">{q.main}</div>
                  <ul className="list-disc ml-6">
                    {q.subs.map((sub, i) => <li key={i}>{sub}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionGenerator;
