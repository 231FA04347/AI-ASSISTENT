import React, { useState, useRef } from 'react';
import { FiPlay, FiSave, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProgrammingEditor = ({ assignment, onSubmit, submitting }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(assignment.programmingLanguages?.[0] || 'python');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [activeTab, setActiveTab] = useState('editor'); // editor, input, output

  const codeEditorRef = useRef(null);

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setRunning(true);
    try {
      // Judge0 language_id: 50 = C (GCC 9.2.0), 71 = Python 3, etc.
      // Map your language variable to Judge0 language_id as needed
      const languageMap = {
        'c': 50,
        'cpp': 54,
        'python': 71,
        'java': 62
      };
      const language_id = languageMap[language.toLowerCase()] || 50;
      const response = await fetch('https://ce.judge0.com/submissions/?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_code: code,
          language_id,
          stdin: input || ''
        }),
      });

      const result = await response.json();

      if (result.stdout !== null) {
        setOutput(result.stdout);
        toast.success('Code executed successfully');
      } else if (result.stderr) {
        setOutput(result.stderr);
        toast.error('Code execution error');
      } else if (result.compile_output) {
        setOutput(result.compile_output);
        toast.error('Compilation error');
      } else {
        setOutput('Unknown error');
        toast.error('Unknown error');
      }
    } catch (error) {
      setOutput('Error: ' + error.message);
      toast.error('Failed to execute code');
    } finally {
      setRunning(false);
    }
  };

  const handleRunWithInput = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setRunning(true);
    try {
      const languageMap = {
        'c': 50,
        'cpp': 54,
        'python': 71,
        'java': 62
      };
      const language_id = languageMap[language.toLowerCase()] || 50;
      const response = await fetch('https://ce.judge0.com/submissions/?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_code: code,
          language_id,
          stdin: input || ''
        }),
      });

      const result = await response.json();

      if (result.stdout !== null) {
        setOutput(result.stdout);
        setActiveTab('output');
        toast.success('Code executed successfully');
      } else if (result.stderr) {
        setOutput(result.stderr);
        toast.error('Code execution error');
      } else if (result.compile_output) {
        setOutput(result.compile_output);
        toast.error('Compilation error');
      } else {
        setOutput('Unknown error');
        toast.error('Unknown error');
      }
    } catch (error) {
      setOutput('Error: ' + error.message);
      toast.error('Failed to execute code');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }

    // Calculate score based on test results if available
    let score = 0;
    if (testResults) {
      score = testResults.totalScore;
    }

    onSubmit({
      code,
      language,
      testResults,
      score,
      totalPoints: testResults?.maxScore || assignment.totalPoints,
    });
  };

  const languageOptions = assignment.programmingLanguages || ['python', 'javascript', 'java'];

  return (
    <div className="space-y-4">
      {/* Question Section */}
      {assignment.question && (
        <button
          onClick={() => setShowQuestion(!showQuestion)}
          className="w-full bg-blue-50 border border-blue-300 rounded-lg p-4 text-left hover:bg-blue-100 transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 text-lg">Problem Statement</h3>
            </div>
            {showQuestion ? <FiChevronUp className="text-blue-600" /> : <FiChevronDown className="text-blue-600" />}
          </div>
        </button>
      )}

      {assignment.question && showQuestion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 whitespace-pre-wrap text-gray-800">
          {assignment.question}
        </div>
      )}

      {/* Visible Test Cases Info */}
      {assignment.visibleTestCases && assignment.visibleTestCases.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-bold text-green-900 mb-3">Visible Test Cases ({assignment.visibleTestCases.length})</h3>
          <p className="text-green-700 text-sm mb-3">These test cases are shown to help you validate your solution. Hidden test cases will be used for final grading.</p>
          <div className="space-y-2">
            {assignment.visibleTestCases.map((tc, idx) => (
              <div key={tc.id} className="bg-white border border-green-200 rounded p-3 text-sm">
                <p className="font-semibold text-green-900 mb-1">Test Case {idx + 1} ({tc.points} pt{tc.points > 1 ? 's' : ''})</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-600 text-xs font-semibold">Input:</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{tc.input || '(empty)'}</pre>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-semibold">Expected Output:</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto text-green-700">{tc.expectedOutput || '(empty)'}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
        {/* Controls Bar */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 space-y-3">
          <div className="flex gap-4 items-center flex-wrap">
            <div>
              <label className="text-sm font-semibold text-gray-300 block mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {languageOptions.map(lang => (
                  <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setCode('')}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
                title="Clear code"
              >
                <FiRefreshCw size={18} />
              </button>

              <button
                onClick={handleRunWithInput}
                disabled={running}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                title="Run with input"
              >
                <FiPlay size={18} /> {running ? 'Running...' : 'Run'}
              </button>

              <button
                onClick={handleRunCode}
                disabled={running}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                title="Run test cases"
              >
                <FiPlay size={18} /> Test Cases
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-t border-gray-700 pt-3">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                activeTab === 'editor' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Code Editor
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                activeTab === 'input' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Input
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                activeTab === 'output' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Output
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex gap-4 min-h-96 bg-gray-900">
          {activeTab === 'editor' && (
            <textarea
              ref={codeEditorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your code here... (Ctrl+Enter to run)"
              className="w-full bg-gray-900 text-gray-100 font-mono p-4 border-none focus:outline-none resize-none"
              style={{
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'Courier New, monospace',
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  handleRunWithInput();
                }
              }}
            />
          )}

          {activeTab === 'input' && (
            <div className="w-full p-4 space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Standard Input</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input for your program (one line per input)"
                className="w-full h-full bg-gray-800 text-gray-100 border border-gray-700 rounded p-3 font-mono focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          )}

          {activeTab === 'output' && (
            <div className="w-full p-4 space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Output</label>
              <div className="w-full h-full bg-gray-800 border border-gray-700 rounded p-3 font-mono overflow-y-auto">
                {output ? (
                  <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
                ) : (
                  <p className="text-gray-500">No output yet. Run your code to see results here.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-4">
          <button
            onClick={() => setShowTestResults(!showTestResults)}
            className="flex items-center gap-2 w-full bg-blue-50 border border-blue-200 rounded-lg p-4 text-left hover:bg-blue-100 transition"
          >
            {showTestResults ? <FiChevronUp /> : <FiChevronDown />}
            <span className="font-bold text-blue-900">
              Test Results: {testResults.results.filter(r => r.passed).length}/{testResults.results.length} Passed
              ({testResults.percentage.toFixed(1)}%)
            </span>
          </button>

          {showTestResults && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.results.map((result, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${
                    result.passed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-bold ${result.passed ? 'text-green-900' : 'text-red-900'}`}>
                      Test Case {idx + 1} {result.passed ? '✓ PASSED' : '✗ FAILED'}
                    </h4>
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      result.passed
                        ? 'bg-green-200 text-green-900'
                        : 'bg-red-200 text-red-900'
                    }`}>
                      {result.score}/{testResults.results[idx].score || 1} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-700">Input:</p>
                      <pre className="bg-white p-2 rounded border border-gray-300 text-xs overflow-x-auto">
                        {result.input || '(empty)'}
                      </pre>
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-gray-700">Expected Output:</p>
                      <pre className="bg-white p-2 rounded border border-gray-300 text-xs overflow-x-auto text-green-700">
                        {result.expectedOutput || '(empty)'}
                      </pre>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <p className="font-semibold text-gray-700">Your Output:</p>
                      <pre className={`p-2 rounded border text-xs overflow-x-auto ${
                        result.passed
                          ? 'bg-white border-gray-300 text-green-700'
                          : 'bg-white border-gray-300 text-red-700'
                      }`}>
                        {result.actualOutput || '(empty)'}
                      </pre>
                    </div>

                    {result.error && (
                      <div className="space-y-1 col-span-2">
                        <p className="font-semibold text-red-700">Error:</p>
                        <pre className="bg-red-100 p-2 rounded border border-red-300 text-xs overflow-x-auto text-red-900">
                          {result.error}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !code.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
      >
        <FiSave size={20} /> {submitting ? 'Submitting...' : 'Submit Code'}
      </button>

      {testResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 font-semibold">
            Score: {testResults.totalScore} / {testResults.maxScore} points ({testResults.percentage.toFixed(1)}%)
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgrammingEditor;
