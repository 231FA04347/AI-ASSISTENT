import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProgrammingAssignmentBuilder = ({ assignment, onAssignmentChange }) => {
  const [expandedSections, setExpandedSections] = useState({
    languages: true,
    question: true,
    visible: true,
    hidden: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addTestCase = (type) => {
    const testCases = type === 'visible' ? assignment.visibleTestCases || [] : assignment.hiddenTestCases || [];
    const newTestCase = {
      id: `tc_${Date.now()}`,
      input: '',
      expectedOutput: '',
      points: 1,
    };
    
    if (type === 'visible') {
      onAssignmentChange({
        ...assignment,
        visibleTestCases: [...testCases, newTestCase],
      });
    } else {
      onAssignmentChange({
        ...assignment,
        hiddenTestCases: [...testCases, newTestCase],
      });
    }
    toast.success(`${type} test case added`);
  };

  const updateTestCase = (type, id, field, value) => {
    const testCases = type === 'visible' ? assignment.visibleTestCases || [] : assignment.hiddenTestCases || [];
    const updated = testCases.map(tc => 
      tc.id === id ? { ...tc, [field]: value } : tc
    );
    
    if (type === 'visible') {
      onAssignmentChange({
        ...assignment,
        visibleTestCases: updated,
      });
    } else {
      onAssignmentChange({
        ...assignment,
        hiddenTestCases: updated,
      });
    }
  };

  const removeTestCase = (type, id) => {
    const testCases = type === 'visible' ? assignment.visibleTestCases || [] : assignment.hiddenTestCases || [];
    const updated = testCases.filter(tc => tc.id !== id);
    
    if (type === 'visible') {
      onAssignmentChange({
        ...assignment,
        visibleTestCases: updated,
      });
    } else {
      onAssignmentChange({
        ...assignment,
        hiddenTestCases: updated,
      });
    }
    toast.success(`Test case removed`);
  };

  return (
    <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
      {/* Programming Languages */}
      <div className="border border-blue-300 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('languages')}
          className="w-full bg-blue-100 hover:bg-blue-150 p-3 flex items-center justify-between text-left font-semibold text-blue-900 transition"
        >
          <span>Supported Languages</span>
          {expandedSections.languages ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expandedSections.languages && (
          <div className="p-4 bg-white space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Languages (comma-separated or click to add)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(assignment.programmingLanguages || ['python']).map((lang, idx) => (
                  <div key={idx} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {lang}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = assignment.programmingLanguages.filter((_, i) => i !== idx);
                        onAssignmentChange({
                          ...assignment,
                          programmingLanguages: updated.length > 0 ? updated : ['python'],
                        });
                      }}
                      className="hover:text-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !(assignment.programmingLanguages || []).includes(value)) {
                    onAssignmentChange({
                      ...assignment,
                      programmingLanguages: [...(assignment.programmingLanguages || []), value],
                    });
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
              >
                <option value="">Add Language...</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="border border-blue-300 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('question')}
          className="w-full bg-blue-100 hover:bg-blue-150 p-3 flex items-center justify-between text-left font-semibold text-blue-900 transition"
        >
          <span>Programming Question</span>
          {expandedSections.question ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expandedSections.question && (
          <div className="p-4 bg-white">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Question (Problem Statement)</label>
            <textarea
              value={assignment.question || ''}
              onChange={(e) => onAssignmentChange({
                ...assignment,
                question: e.target.value,
              })}
              placeholder="Write the programming problem statement here..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
              rows="5"
            />
          </div>
        )}
      </div>

      {/* Visible Test Cases */}
      <div className="border border-green-300 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('visible')}
          className="w-full bg-green-100 hover:bg-green-150 p-3 flex items-center justify-between text-left font-semibold text-green-900 transition"
        >
          <span>Visible Test Cases (shown to students)</span>
          {expandedSections.visible ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expandedSections.visible && (
          <div className="p-4 bg-white space-y-4">
            {(assignment.visibleTestCases || []).map((testCase, idx) => (
              <div key={testCase.id} className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-green-900">Test Case {idx + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeTestCase('visible', testCase.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Input</label>
                    <textarea
                      value={testCase.input}
                      onChange={(e) => updateTestCase('visible', testCase.id, 'input', e.target.value)}
                      placeholder="Enter input..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-blue-600"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Output</label>
                    <textarea
                      value={testCase.expectedOutput}
                      onChange={(e) => updateTestCase('visible', testCase.id, 'expectedOutput', e.target.value)}
                      placeholder="Enter expected output..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-blue-600"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Points</label>
                    <input
                      type="number"
                      value={testCase.points}
                      onChange={(e) => updateTestCase('visible', testCase.id, 'points', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addTestCase('visible')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              <FiPlus /> Add Visible Test Case
            </button>
          </div>
        )}
      </div>

      {/* Hidden Test Cases */}
      <div className="border border-purple-300 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('hidden')}
          className="w-full bg-purple-100 hover:bg-purple-150 p-3 flex items-center justify-between text-left font-semibold text-purple-900 transition"
        >
          <span>Hidden Test Cases (used for grading)</span>
          {expandedSections.hidden ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expandedSections.hidden && (
          <div className="p-4 bg-white space-y-4">
            <p className="text-sm text-purple-700">
              <strong>Note:</strong> Hidden test cases are not shown to students but are used to calculate the final score.
            </p>
            
            {(assignment.hiddenTestCases || []).map((testCase, idx) => (
              <div key={testCase.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-purple-900">Hidden Test Case {idx + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeTestCase('hidden', testCase.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Input</label>
                    <textarea
                      value={testCase.input}
                      onChange={(e) => updateTestCase('hidden', testCase.id, 'input', e.target.value)}
                      placeholder="Enter input..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-blue-600"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Output</label>
                    <textarea
                      value={testCase.expectedOutput}
                      onChange={(e) => updateTestCase('hidden', testCase.id, 'expectedOutput', e.target.value)}
                      placeholder="Enter expected output..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-blue-600"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Points</label>
                    <input
                      type="number"
                      value={testCase.points}
                      onChange={(e) => updateTestCase('hidden', testCase.id, 'points', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addTestCase('hidden')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              <FiPlus /> Add Hidden Test Case
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgrammingAssignmentBuilder;
