import React, { useState, useEffect, useRef } from 'react';
import { FiMinimize2, FiPlay, FiRefreshCw, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

const FullScreenAssignmentMode = ({ assignment, onSubmit, onExit }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [escapeAttempts, setEscapeAttempts] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(assignment.programmingLanguages?.[0] || 'python');
  const [testResults, setTestResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState('statement');
  const [expandCustomInput, setExpandCustomInput] = useState(true);
  const containerRef = useRef(null);

  // Request full-screen on mount
  useEffect(() => {
    if (!isFullScreen) {
      setTimeout(() => {
        const shouldEnterFullScreen = window.confirm(
          `📖 Enter Full-Screen Mode for "${assignment.title}"?\n\nYou can exit 2 times. The 3rd time you try to exit, the assignment will be submitted automatically.\n\nClick OK to enter full-screen mode.`
        );
        if (shouldEnterFullScreen) {
          enterFullScreen();
        }
      }, 500);
    }
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        e.preventDefault();
        handleEscapeAttempt();
      }
    };

    if (isFullScreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullScreen, escapeAttempts]);

  const enterFullScreen = async () => {
    try {
      const elem = containerRef.current;
      if (elem) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        }
        setIsFullScreen(true);
        setEscapeAttempts(0);
        toast.success('Full-Screen Mode Activated');
      }
    } catch (error) {
      toast.error('Could not enter full-screen mode');
    }
  };

  const handleEscapeAttempt = () => {
    const newAttempts = escapeAttempts + 1;
    setEscapeAttempts(newAttempts);

    if (newAttempts === 1) {
      toast('⚠️ Exit Attempt 1/2: You have 1 more chance to exit', { duration: 5000 });
    } else if (newAttempts === 2) {
      toast('⚠️ Exit Attempt 2/2: Next escape will submit automatically!', { duration: 5000 });
    } else {
      toast.success('🎯 Submitting assignment automatically...');
      submitAssignment();
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setRunning(true);
    try {
      const response = await fetch('/api/code-execution/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code,
          language,
          assignmentId: assignment._id,
        }),
      });

      const result = await response.json();

      if (result.success || result.results) {
        if (result.results) {
          setTestResults(result);
          toast.success(`Tests: ${result.results.filter(r => r.passed).length}/${result.results.length} passed`);
        } else {
          setOutput(result.output || result.error || '');
          toast.success('Code executed');
        }
      } else {
        toast.error('Code execution failed');
      }
    } catch (error) {
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
      const response = await fetch('/api/code-execution/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code,
          language,
          input: input || '',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOutput(result.output || '');
        toast.success('Code executed');
      } else {
        toast.error('Execution failed');
      }
    } catch (error) {
      toast.error('Failed to execute code');
    } finally {
      setRunning(false);
    }
  };

  const submitAssignment = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }

    try {
      await onSubmit({
        code,
        language,
        explanation: '',
      });
      setIsFullScreen(false);
    } catch (error) {
      toast.error('Failed to submit');
    }
  };

  const exitFullScreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullScreen(false);
      onExit();
    } catch (error) {
      console.log('Exit fullscreen error:', error);
    }
  };

  if (!isFullScreen) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600">Requesting full-screen mode...</p>
        </div>
      </div>
    );
  }

  const languageOptions = assignment.programmingLanguages || ['python', 'javascript', 'java'];
  const tabItems = [
    { id: 'statement', label: 'Statement' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'ai', label: 'AI Help' },
  ];

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-gray-950 text-white flex flex-col overflow-hidden"
    >
      {/* Top Navigation Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-semibold text-gray-100">{assignment.title}</h1>
          
          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-800 -mb-4">
            {tabItems.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-gray-100 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
          >
            {languageOptions.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <button
            onClick={exitFullScreen}
            className="text-gray-400 hover:text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition"
          >
            <FiMinimize2 size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left Side - Problem Statement */}
        <div className="w-1/3 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex flex-col">
          {activeTab === 'statement' && (
            <>
              <div className="p-4 border-b border-gray-800 flex-shrink-0">
                <h2 className="text-base font-bold text-gray-100">
                  {assignment.type === 'programming' ? 'Question' : 'Problem Statement'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {assignment.type === 'programming'
                    ? (assignment.question || '')
                    : (assignment.description || assignment.content || '')}
                </div>
              </div>
            </>
          )}

          {activeTab === 'submissions' && (
            <div className="p-6 flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="mb-2">Previous Submissions</p>
                <p className="text-sm">No submissions yet</p>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="p-6 flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="mb-2">⭐ AI Help</p>
                <p className="text-sm">AI assistance coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Code Editor and Output */}
        <div className="w-2/3 flex flex-col gap-4 overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 flex flex-col overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 p-3 flex justify-between items-center flex-shrink-0">
              <span className="text-gray-400 text-sm">Code Editor</span>
              <button
                onClick={() => setCode('')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition flex items-center gap-1"
              >
                <FiRefreshCw size={14} /> Clear
              </button>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="# cook your dish here"
              className="flex-1 bg-gray-950 text-gray-100 font-mono p-4 border-none focus:outline-none resize-none text-sm"
              style={{ fontFamily: 'Courier New, monospace', lineHeight: '1.6' }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  handleRunWithInput();
                }
              }}
            />
          </div>

          {/* Test against Custom Input */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 flex flex-col max-h-48">
            <button
              onClick={() => setExpandCustomInput(!expandCustomInput)}
              className="bg-gray-800 border-b border-gray-700 p-3 flex justify-between items-center hover:bg-gray-750 transition text-sm text-gray-300 font-medium"
            >
              Test against Custom Input
              {expandCustomInput && <FiChevronUp size={18} />}
            </button>

            {expandCustomInput && (
              <div className="flex-1 overflow-y-auto flex gap-4 p-3">
                {/* Input Area */}
                <div className="flex-1 flex flex-col">
                  <label className="text-xs text-gray-400 font-semibold mb-2">Input</label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter input..."
                    className="flex-1 bg-gray-800 text-gray-100 border border-gray-700 rounded px-2 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Output Area */}
                <div className="flex-1 flex flex-col">
                  <label className="text-xs text-gray-400 font-semibold mb-2">Output</label>
                  <div className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-2 text-xs font-mono overflow-y-auto">
                    <pre className="text-green-400 whitespace-pre-wrap">{output || '(no output)'}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={handleRunWithInput}
              disabled={running}
              className="flex-1 bg-white hover:bg-gray-100 text-gray-900 px-6 py-2.5 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiPlay size={18} /> {running ? 'Running...' : 'Run'}
            </button>

            <button
              onClick={handleRunCode}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-semibold transition text-sm"
            >
              Test Cases
            </button>

            <button
              onClick={submitAssignment}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition"
            >
              Submit
            </button>

            <button
              onClick={() => toast.info('Next problem coming soon...')}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-semibold transition text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Test Results Section */}
      {testResults && testResults.results && (
        <div className="bg-gray-900 border-t border-gray-800 p-4 max-h-32 overflow-y-auto">
          <div className="text-sm text-gray-300">
            <p className="font-semibold mb-2">
              Results: {testResults.results.filter(r => r.passed).length}/{testResults.results.length} Passed
            </p>
            <div className="grid grid-cols-4 gap-2">
              {testResults.results.map((result, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-1 rounded text-xs font-mono ${
                    result.passed
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  }`}
                >
                  {result.passed ? '✓' : '✗'} Test {idx + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Warning */}
      {escapeAttempts > 0 && (
        <div className="bg-yellow-900 border-t border-yellow-700 px-6 py-2 text-center text-xs text-yellow-200">
          ⚠️ Exit attempts: {escapeAttempts}/2 | Press Escape or close to leave
        </div>
      )}
    </div>
  );
};

export default FullScreenAssignmentMode;
