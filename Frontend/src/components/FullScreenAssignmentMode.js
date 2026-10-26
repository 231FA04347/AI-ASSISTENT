import React, { useState, useEffect, useRef } from 'react';
import { FiMinimize2, FiPlay, FiRefreshCw, FiChevronUp, FiChevronDown } from 'react-icons/fi';
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
  const [expandedTestCase, setExpandedTestCase] = useState(null);
  const [expandTestResults, setExpandTestResults] = useState(true);
  const containerRef = useRef(null);
  const testResultsRef = useRef(null);
  const programmaticExitRef = useRef(false);

  const registerExitAttempt = (label = 'Exit') => {
    const nextAttempts = escapeAttempts + 1;
    setEscapeAttempts(nextAttempts);

    if (nextAttempts === 1) {
      toast('⚠️ Exit Attempt 1/2: You have 1 more chance to exit', { duration: 5000 });
      return { nextAttempts, shouldAutoSubmit: false };
    }
    if (nextAttempts === 2) {
      toast('⚠️ Exit Attempt 2/2: Next exit will submit automatically!', { duration: 5000 });
      return { nextAttempts, shouldAutoSubmit: false };
    }

    toast.success(`🎯 ${label}: Submitting automatically...`);
    return { nextAttempts, shouldAutoSubmit: true };
  };

  // Keep isFullScreen in sync with the browser fullscreen state
  useEffect(() => {
    const onFsChange = () => {
      const nowFull = Boolean(document.fullscreenElement);

      // If the user left fullscreen without using our exit button, count it.
      if (!nowFull && isFullScreen && !programmaticExitRef.current) {
        const { shouldAutoSubmit } = registerExitAttempt('Fullscreen exited');
        if (shouldAutoSubmit) {
          submitAssignment();
        }
      }

      setIsFullScreen(nowFull);
    };

    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isFullScreen, escapeAttempts]);

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
      if (!elem) {
        toast.error('Element not found');
        return;
      }
      
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      } else {
        toast.error('Fullscreen not supported in this browser');
        return;
      }
      
      setIsFullScreen(true);
      setEscapeAttempts(0);
      toast.success('Full-Screen Mode Activated');
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast.error('Could not enter full-screen mode: ' + error.message);
    }
  };

  const handleEscapeAttempt = () => {
    const { shouldAutoSubmit } = registerExitAttempt('Escape');
    if (shouldAutoSubmit) submitAssignment();
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    console.log('=== Starting Test Execution ===');
    console.log('Assignment:', assignment);
    console.log('Language:', language);
    console.log('Code:', code.substring(0, 100) + '...');

    setRunning(true);
    setTestResults(null);
    const loadingToastId = toast.loading('Running tests...');

    try {
      if (!assignment._id) {
        throw new Error('Assignment ID is missing');
      }

      const payload = {
        code,
        language,
        assignmentId: assignment._id,
      };

      console.log('Sending payload:', payload);

      const response = await fetch('/api/code-execution/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }

        const message =
          data?.error ||
          data?.message ||
          `HTTP ${response.status}`;
        const hint = data?.hint ? `\n${data.hint}` : '';

        setTestResults({ success: false, error: message, hint: data?.hint });
        throw new Error(`${message}${hint}`);
      }

      const result = await response.json();
      console.log('✓ Test results received:', result);

      // Normalize response shape so UI always reads from `results`
      const normalizedResult = result?.results
        ? result
        : (result?.visibleResults ? { ...result, results: result.visibleResults } : result);

      if (normalizedResult.success || normalizedResult.results) {
        setTestResults(normalizedResult);
        setExpandTestResults(true);
        setExpandedTestCase(null);

        if (normalizedResult.results && normalizedResult.results.length > 0) {
          const passed = normalizedResult.results.filter(r => r.passed).length;
          toast.success(`Tests Complete: ${passed}/${normalizedResult.results.length} passed`);

          // Ensure results are visible without manual scrolling
          setTimeout(() => {
            testResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        } else {
          toast.success('Code executed successfully');
        }
      } else {
        setTestResults({ success: false, error: normalizedResult.error || normalizedResult.message || 'Unknown error from API', hint: normalizedResult.hint });
        throw new Error(normalizedResult.error || normalizedResult.message || 'Unknown error from API');
      }
    } catch (error) {
      console.error('❌ Test execution error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      toast.error('Error: ' + error.message);
    } finally {
      toast.dismiss(loadingToastId);
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

      if (!response.ok) {
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
        const message = data?.error || data?.message || `HTTP ${response.status}`;
        const hint = data?.hint ? `\n${data.hint}` : '';
        throw new Error(`${message}${hint}`);
      }

      const result = await response.json();

      if (result.success) {
        setOutput(result.output || '');
        toast.success('Code executed');
      } else {
        throw new Error(result.error || result.message || 'Execution failed');
      }
    } catch (error) {
      console.error('Execution error:', error);
      toast.error('Execution failed: ' + error.message);
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
      toast.success('Submitted successfully!');
      // Stay in fullscreen
    } catch (error) {
      toast.error('Failed to submit');
    }
  };

  const exitFullScreen = async () => {
    try {
      const { shouldAutoSubmit } = registerExitAttempt('Exit');
      if (shouldAutoSubmit) {
        submitAssignment();
        return;
      }

      programmaticExitRef.current = true;
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullScreen(false);
      onExit();
      setTimeout(() => {
        programmaticExitRef.current = false;
      }, 250);
    } catch (error) {
      console.log('Exit fullscreen error:', error);
    }
  };

  if (!isFullScreen) {
    return (
      <div ref={containerRef} className="w-full h-screen bg-gray-950 text-white flex items-center justify-center p-8">
        <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-2">Enter Full Screen</h2>
          <p className="text-sm text-gray-300 mb-4">
            This assignment runs in full-screen mode. You can exit 2 times. The 3rd exit attempt will submit automatically.
          </p>
          <div className="text-xs text-gray-400 mb-6">
            Current exit attempts: {escapeAttempts}/2
          </div>
          <button
            onClick={() => {
              const ok = window.confirm(
                `📖 Enter Full-Screen Mode for "${assignment.title}"?\n\nYou can exit 2 times. The 3rd time you try to exit, the assignment will be submitted automatically.`
              );
              if (ok) enterFullScreen();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Enter Full Screen
          </button>
          <p className="mt-3 text-xs text-gray-500">
            If your browser blocks fullscreen, click the button again.
          </p>
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
      className="w-full h-screen bg-gray-950 text-white flex flex-col overflow-y-auto"
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
      <div className="flex flex-1 gap-4 overflow-y-auto p-4 min-h-0">
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
          {testResults && testResults.results && testResults.results.length > 0 && (
            <div className="-mt-2 text-xs text-gray-300">
              Last run: <span className="font-semibold text-green-300">{testResults.results.filter(r => r.passed).length}</span>
              <span className="text-gray-400">/</span>
              <span className="font-semibold">{testResults.results.length}</span> passed
            </div>
          )}
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={handleRunCode}
              disabled={running}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiPlay size={18} /> {running ? 'Running Tests...' : 'Run Tests'}
            </button>

            <button
              onClick={handleRunWithInput}
              disabled={running}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-semibold transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Run Custom Input
            </button>

            <button
              onClick={submitAssignment}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition"
            >
              Submit
            </button>

            <button
              onClick={() => toast('Next problem coming soon...', { icon: 'ℹ️', duration: 3000 })}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-semibold transition text-sm"
            >
              Next
            </button>

            <button
              onClick={async () => {
                try {
                  await onSubmit({ code, language, explanation: '', endTest: true });
                  // Exit fullscreen and show toast after exit
                  if (document.fullscreenElement) {
                    await document.exitFullscreen();
                  }
                  setIsFullScreen(false);
                  setTimeout(() => {
                    toast.success('Your assignment is completed!');
                  }, 300);
                } catch (err) {
                  toast.error('Failed to end test: ' + (err?.message || err));
                }
              }}
              className="flex-1 bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-lg font-semibold transition text-sm"
            >
              End Test
            </button>
          </div>
        </div>
      </div>

      {/* Test Results Section - Collapsible with Summary */}
      <div ref={testResultsRef} />
      {testResults && testResults.results && testResults.results.length > 0 ? (
        <div className="bg-gray-900 border-t-2 border-green-600 flex flex-col max-h-80">
          {/* Summary Header - Always Visible */}
          <button
            onClick={() => setExpandTestResults(!expandTestResults)}
            className="w-full bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 border-b border-green-700 p-4 flex justify-between items-center transition"
          >
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-lg font-bold text-white">
                  ✓ Test Results
                </p>
                <p className="text-xl font-bold text-green-300">
                  {testResults.results.filter(r => r.passed).length} / {testResults.results.length} Test Cases Passed
                </p>
                <p className="text-sm text-green-200">
                  Pass Rate: {((testResults.results.filter(r => r.passed).length / testResults.results.length) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="text-2xl">
              {expandTestResults ? '▼' : '▶'}
            </div>
          </button>

          {/* Detailed Results - Collapsible */}
          {expandTestResults && (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-950">
              <div className="space-y-2">
                {testResults.results.map((result, idx) => (
                  <div
                    key={idx}
                    onClick={() => setExpandedTestCase(expandedTestCase === idx ? null : idx)}
                    className={`border-2 rounded-lg cursor-pointer transition-all ${
                      result.passed
                        ? 'border-green-600 bg-green-900 hover:bg-green-800'
                        : 'border-red-600 bg-red-900 hover:bg-red-800'
                    }`}
                  >
                    {/* Test Case Header */}
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full ${result.passed ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${result.passed ? 'text-green-100' : 'text-red-100'}`}>
                            Test Case {idx + 1}
                            <span className={`ml-3 text-sm font-semibold ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
                              {result.passed ? '✓ PASSED' : '✗ FAILED'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-xl text-gray-300">
                        {expandedTestCase === idx ? '▼' : '▶'}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedTestCase === idx && (
                      <div className="border-t border-gray-700 p-4 bg-gray-900 space-y-3">
                        <div>
                          <p className="text-sm font-bold text-gray-300 mb-2">📥 Input:</p>
                          <div className="bg-black p-3 rounded font-mono text-green-400 text-xs max-h-24 overflow-y-auto border border-gray-700">
                            {result.input || '(empty)'}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-300 mb-2">📤 Expected Output:</p>
                          <div className="bg-black p-3 rounded font-mono text-blue-400 text-xs max-h-24 overflow-y-auto border border-gray-700">
                            {result.expectedOutput || '(empty)'}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-300 mb-2">🎯 Your Output:</p>
                          <div className={`bg-black p-3 rounded font-mono text-xs max-h-24 overflow-y-auto border ${
                            result.passed ? 'border-green-700 text-green-400' : 'border-red-700 text-yellow-400'
                          }`}>
                            {result.actualOutput || '(empty)'}
                          </div>
                        </div>

                        {result.error && (
                          <div>
                            <p className="text-sm font-bold text-red-300 mb-2">⚠️ Error:</p>
                            <div className="bg-black p-3 rounded font-mono text-red-400 text-xs max-h-24 overflow-y-auto border border-red-700">
                              {result.error}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : testResults ? (
        <div className="bg-gray-900 border-t border-gray-800 p-4 text-center text-gray-300">
          {testResults.success === false ? (
            <div className="max-w-3xl mx-auto">
              <p className="font-semibold text-red-300">Execution service unavailable</p>
              <p className="text-sm text-red-200 mt-2 whitespace-pre-wrap">{testResults.error || 'Failed to execute code'}</p>
              {testResults.hint && (
                <p className="text-xs text-yellow-200 mt-2 whitespace-pre-wrap">{testResults.hint}</p>
              )}
            </div>
          ) : (
            <p>No test cases available for this assignment</p>
          )}
        </div>
      ) : null}

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
