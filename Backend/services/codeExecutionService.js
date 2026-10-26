const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Using Piston API via Vercel mirror (more reliable than Judge0)
// Or fallback to local Python/Node.js execution
const PISTON_API_URL = (process.env.PISTON_API_URL || 'https://piston-api.vercel.app/api/v2/execute').trim();

// Map language names to Piston language runtimes
const languageMap = {
  'javascript': 'javascript',
  'python': 'python',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'ruby': 'ruby',
  'go': 'go',
  'rust': 'rust',
  'php': 'php',
};

// Get Piston runtime for language
const getPistonRuntime = (language) => {
  const key = language?.toLowerCase();
  return languageMap[key] || 'python';
};

// Local fallback executor (for Python and JavaScript only)
// NOTE: This is a dev fallback; for production prefer a sandboxed executor.
const executeLocal = (code, language = 'python', testInput = '') => {
  try {
    const lang = String(language || '').toLowerCase();
    const tmpDir = os.tmpdir();

    if (lang === 'python') {
      const tempFile = path.join(tmpDir, `ai_assistant_${Date.now()}.py`);
      fs.writeFileSync(tempFile, code, 'utf8');

      // Try 'py', then 'python', then 'python3'
      const candidates = process.platform === 'win32'
        ? [`py -3 "${tempFile}"`, `python "${tempFile}"`, `python3 "${tempFile}"`]
        : [`python3 "${tempFile}"`, `python "${tempFile}"`];
      let lastError = null;
      for (const cmd of candidates) {
        try {
          const output = execSync(cmd, {
            input: testInput || '',
            encoding: 'utf-8',
            timeout: 7000,
            maxBuffer: 1024 * 1024,
          });
          return { success: true, output, error: '', exitCode: 0 };
        } catch (err) {
          lastError = err;
        }
      }
      return {
        success: false,
        output: '',
        error: lastError?.stderr?.toString() || lastError?.message || 'No Python interpreter found',
        exitCode: 1,
      };
    }

    if (lang === 'javascript') {
      const tempFile = path.join(tmpDir, `ai_assistant_${Date.now()}.js`);
      fs.writeFileSync(tempFile, code, 'utf8');

      const output = execSync(`node "${tempFile}"`, {
        input: testInput || '',
        encoding: 'utf-8',
        timeout: 7000,
        maxBuffer: 1024 * 1024,
      });

      return { success: true, output, error: '', exitCode: 0 };
    }
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.stderr?.toString() || error.message,
      exitCode: 1,
    };
  }

  return {
    success: false,
    output: '',
    error: `Local execution fallback only supports Python/JavaScript (got: ${language})`,
    exitCode: 1,
  };
};

// Execute code using Piston API (with local fallback for Python/JS)
exports.executeCode = async (code, language = 'python', testInput = '', timeout = 10000) => {
  try {
    const runtime = getPistonRuntime(language);
    
    const payload = {
      language: runtime,
      version: '*',
      files: [
        {
          name: runtime === 'javascript' ? 'main.js' : 
                 runtime === 'python' ? 'main.py' :
                 runtime === 'java' ? 'Main.java' :
                 runtime === 'cpp' ? 'main.cpp' :
                 runtime === 'c' ? 'main.c' : 'main.rb',
          content: code,
        },
      ],
      stdin: testInput || '',
    };

    try {
      const response = await axios.post(PISTON_API_URL, payload, { timeout: 30000 });
      return {
        success: true,
        output: response.data.run?.stdout || '',
        error: response.data.run?.stderr || '',
        exitCode: response.data.run?.code || 0,
      };
    } catch (apiError) {
      // If Piston API fails, try local executor for Python/JS
      if (['python', 'javascript'].includes(runtime.toLowerCase())) {
        console.warn('Piston API failed, trying local executor...');
        return executeLocal(code, language, testInput);
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Code Execution Error:', {
      message: error.message,
      status: error.response?.status,
    });

    return {
      success: false,
      output: '',
      error: error.message || 'Failed to execute code',
      hint: 'Code execution service failed. Please try again.',
      exitCode: 1,
    };
  }
};

// Execute code with test cases
exports.executeWithTestCases = async (code, language, testCases = []) => {
  try {
    const results = [];

    for (const testCase of testCases) {
      const result = await exports.executeCode(code, language, testCase.input || '');
      
      const passed = result.output?.trim() === testCase.expectedOutput?.trim();
      
      results.push({
        testCaseId: testCase.id,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.output,
        error: result.error,
        passed,
        score: passed ? (testCase.points || 1) : 0,
      });
    }

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = testCases.reduce((sum, tc) => sum + (tc.points || 1), 0);

    return {
      success: true,
      results,
      totalScore,
      maxScore,
      percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
    };
  } catch (error) {
    console.error('Test case execution error:', error.message);
    return {
      success: false,
      results: [],
      totalScore: 0,
      maxScore: 0,
      error: error.message,
    };
  }
};

// Execute code with visible test cases for student preview
exports.executeWithVisibleTestCases = async (code, language, visibleTestCases = []) => {
  try {
    const results = [];

    if (!visibleTestCases || visibleTestCases.length === 0) {
      console.log('No visible test cases provided');
      return {
        success: true,
        results: [],
        totalScore: 0,
        maxScore: 0,
        percentage: 0,
        visibleOnly: true,
      };
    }

    for (const testCase of visibleTestCases) {
      try {
        if (!testCase) continue;
        
        const result = await exports.executeCode(code, language, testCase.input || '');

        if (!result.success) {
          return {
            success: false,
            results: [],
            totalScore: 0,
            maxScore: 0,
            error: result.error || 'Execution service unavailable',
            hint: result.hint,
          };
        }
        
        const passed = result.success && result.output?.trim() === testCase.expectedOutput?.trim();
        
        results.push({
          testCaseId: testCase.id || `test-${results.length}`,
          input: testCase.input || '',
          expectedOutput: testCase.expectedOutput || '',
          actualOutput: result.output || '',
          error: result.error || '',
          passed,
          score: passed ? (testCase.points || 1) : 0,
          isVisible: true,
        });
      } catch (tcError) {
        console.error('Error processing test case:', tcError);
        results.push({
          testCaseId: testCase.id || `test-${results.length}`,
          input: testCase.input || '',
          expectedOutput: testCase.expectedOutput || '',
          actualOutput: '',
          error: tcError.message,
          passed: false,
          score: 0,
          isVisible: true,
        });
      }
    }

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = visibleTestCases.reduce((sum, tc) => sum + (tc.points || 1), 0);

    return {
      success: true,
      results,
      totalScore,
      maxScore,
      percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
      visibleOnly: true,
    };
  } catch (error) {
    console.error('Visible test case execution error:', error);
    return {
      success: false,
      results: [],
      totalScore: 0,
      maxScore: 0,
      error: error.message || 'Unknown error in test execution',
    };
  }
};

// Execute code and grade with hidden test cases (teacher only)
exports.gradeProgrammingSubmission = async (code, language, visibleTestCases = [], hiddenTestCases = []) => {
  try {
    const visibleResults = [];
    const hiddenResults = [];

    // Run visible test cases
    for (const testCase of visibleTestCases) {
      const result = await exports.executeCode(code, language, testCase.input || '');
      const passed = result.output?.trim() === testCase.expectedOutput?.trim();
      
      visibleResults.push({
        testCaseId: testCase.id,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.output,
        error: result.error,
        passed,
        score: passed ? (testCase.points || 1) : 0,
        isVisible: true,
      });
    }

    // Run hidden test cases
    for (const testCase of hiddenTestCases) {
      const result = await exports.executeCode(code, language, testCase.input || '');
      const passed = result.output?.trim() === testCase.expectedOutput?.trim();
      
      hiddenResults.push({
        testCaseId: testCase.id,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.output,
        error: result.error,
        passed,
        score: passed ? (testCase.points || 1) : 0,
        isVisible: false,
      });
    }

    const allResults = [...visibleResults, ...hiddenResults];
    const visibleScore = visibleResults.reduce((sum, r) => sum + r.score, 0);
    const visibleMaxScore = visibleTestCases.reduce((sum, tc) => sum + (tc.points || 1), 0);
    const hiddenScore = hiddenResults.reduce((sum, r) => sum + r.score, 0);
    const hiddenMaxScore = hiddenTestCases.reduce((sum, tc) => sum + (tc.points || 1), 0);
    const totalScore = visibleScore + hiddenScore;
    const totalMaxScore = visibleMaxScore + hiddenMaxScore;

    return {
      success: true,
      visibleResults,
      hiddenResults,
      visibleScore,
      visibleMaxScore,
      hiddenScore,
      hiddenMaxScore,
      totalScore,
      totalMaxScore,
      percentage: totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0,
    };
  } catch (error) {
    console.error('Programming submission grading error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};
