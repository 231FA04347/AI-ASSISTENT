import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI, analyticsAPI } from '../utils/api';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AnalyticsPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [lout, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const formatClassLabel = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    const match = raw.match(/^class\s*(.+)$/i);
    const normalized = (match ? match[1] : raw).trim();
    return normalized ? `Class ${normalized}` : '';
  };

  const getScoreDistributionChart = () => {
    const dist = analytics?.scoreDistribution;
    const excellent = Number(dist?.excellent ?? 0);
    const good = Number(dist?.good ?? 0);
    const average = Number(dist?.average ?? 0);
    const poor = Number(dist?.poor ?? 0);

    const totalStudents = Number(analytics?.totalStudents ?? 0);
    const submittedStudents = Number(analytics?.submittedStudents ?? 0);
    const gradedStudents = Number(analytics?.gradedStudents ?? 0);

    const safeTotal = Number.isFinite(totalStudents) ? totalStudents : 0;
    const safeSubmitted = Number.isFinite(submittedStudents) ? submittedStudents : 0;
    const safeGraded = Number.isFinite(gradedStudents) ? gradedStudents : 0;

    const notSubmitted = Math.max(0, safeTotal - safeSubmitted);
    const ungraded = Math.max(0, safeSubmitted - safeGraded);

    const values = [
      Number.isFinite(excellent) ? excellent : 0,
      Number.isFinite(good) ? good : 0,
      Number.isFinite(average) ? average : 0,
      Number.isFinite(poor) ? poor : 0,
      ungraded,
      notSubmitted,
    ];

    const total = values.reduce((sum, v) => sum + v, 0);

    // Chart.js Pie renders nothing when all values are 0.
    if (!total) {
      return {
        data: {
          labels: ['No graded submissions yet'],
          datasets: [
            {
              data: [1],
              backgroundColor: ['#e5e7eb'],
              borderColor: ['#d1d5db'],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
            tooltip: {
              enabled: false,
            },
          },
        },
        showHint: true,
      };
    }

    return {
      data: {
        labels: [
          'Excellent (90-100)',
          'Good (80-89)',
          'Average (70-79)',
          'Poor (<70)',
          'Submitted (Not Graded Yet)',
          'Not Submitted',
        ],
        datasets: [
          {
            data: values,
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#e5e7eb', '#9ca3af'],
            borderColor: ['#059669', '#1e40af', '#d97706', '#dc2626', '#d1d5db', '#6b7280'],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
      showHint: false,
    };
  };

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      const assignmentResponse = await assignmentAPI.getAssignment(assignmentId);
      setAssignment(assignmentResponse.data);

      const analyticsResponse = await analyticsAPI.getAnalytics(assignmentId);
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      console.log('Analytics not yet generated. Generate from dashboard first.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnalytics = async () => {
    try {
      await analyticsAPI.generateAnalytics(assignmentId);
      toast.success('Analytics generated successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to generate analytics');
    }
  };

  const parseFilenameFromContentDisposition = (headerValue) => {
    if (!headerValue) return null;

    // Try RFC5987 filename*=
    const matchStar = headerValue.match(/filename\*=(?:UTF-8''|)([^;]+)/i);
    if (matchStar?.[1]) {
      try {
        return decodeURIComponent(matchStar[1].trim().replace(/^"|"$/g, ''));
      } catch {
        return matchStar[1].trim().replace(/^"|"$/g, '');
      }
    }

    const match = headerValue.match(/filename=([^;]+)/i);
    if (match?.[1]) return match[1].trim().replace(/^"|"$/g, '');
    return null;
  };

  const toSafeFilename = (input) => {
    const raw = String(input || 'report')
      .replace(/[\r\n\t]+/g, ' ')
      .trim();
    const safe = raw
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    return (safe || 'report').slice(0, 120);
  };

  const handleExportReport = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const response = await analyticsAPI.exportReport(assignmentId);

      const contentType = response?.headers?.['content-type'] ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const contentDisposition = response?.headers?.['content-disposition'];
      const fromHeader = parseFilenameFromContentDisposition(contentDisposition);

      const fallback = `${toSafeFilename(assignment?.title)}-${toSafeFilename(formatClassLabel(assignment?.className))}-report.xlsx`
        .replace(/\-\-+/g, '-');
      const filename = fromHeader || fallback;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch (error) {
      const status = error?.response?.status;

      const tryParseBlobError = async () => {
        const data = error?.response?.data;
        if (!data || typeof data === 'string') return null;
        if (data instanceof Blob) {
          try {
            const text = await data.text();
            return text;
          } catch {
            return null;
          }
        }
        return null;
      };

      let detail = error?.response?.data?.message;

      const blobText = await tryParseBlobError();
      if (!detail && blobText) {
        try {
          const parsed = JSON.parse(blobText);
          detail = parsed?.error || parsed?.message;
          if (!detail && typeof parsed === 'string') detail = parsed;
        } catch {
          detail = blobText;
        }
      }

      // Fall back to Axios message only if we have no better detail.
      if (!detail) detail = error?.message;

      const prefix = status ? `Export failed (${status})` : 'Export failed';
      toast.error(detail ? `${prefix}: ${detail}` : prefix);
    } finally {
      setExporting(false);
    }
  };

  if (lout) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!assignment) {
    return <div className="flex items-center justify-center min-h-screen">Assignment not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <FiArrowLeft /> Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{assignment.title} - Analytics</h1>
              <p className="text-gray-600 mt-2">{formatClassLabel(assignment.className)}</p>
            </div>
            <button
              onClick={handleGenerateAnalytics}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              {analytics ? 'Regenerate Analytics' : 'Generate Analytics'}
            </button>
          </div>
        </div>

        {analytics ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Average Score</p>
                <p className="text-2xl font-bold text-blue-600">{Number(analytics.averageScore ?? 0).toFixed(1)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Highest Score</p>
                <p className="text-2xl font-bold text-green-600">{analytics.highestScore ?? 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Lowest Score</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.lowestScore ?? 0}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Score Distribution Pie Chart */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Score Distribution</h2>
                <p className="text-gray-500 text-sm mb-3">
                  If these numbers look outdated, click "Generate Analytics" again.
                </p>
                {analytics && (() => {
                  const chart = getScoreDistributionChart();
                  return (
                    <>
                      <Pie data={chart.data} options={chart.options} />
                      {chart.showHint && (
                        <p className="text-gray-500 text-sm mt-3">
                          Grade at least one submission to see the real distribution.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Submission Analysis */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Submission Analysis</h2>
                {analytics.submissionAnalysis && (
                  <Bar
                    data={{
                      labels: ['On Time', 'Late'],
                      datasets: [{
                        label: 'Count',
                        data: [
                          analytics.submissionAnalysis.onTimeCount,
                          analytics.submissionAnalysis.lateCount,
                        ],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderColor: ['#059669', '#dc2626'],
                        borderWidth: 2,
                      }],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Summary</h2>
              <div className="space-y-4">
                <div className="border-L-4 border-blue-600 pl-4">
                  <h3 className="font-semibold text-gray-900">Class Performance</h3>
                  <p className="text-gray-600">
                    The class average is {analytics.averageScore.toFixed(1)} with a standard deviation indicating{' '}
                    {Math.abs(analytics.highestScore - analytics.lowestScore) > 50 ? 'significant' : 'moderate'}{' '}
                    variation in student performance.
                  </p>
                </div>
                <div className="border-l-4 border-green-600 pl-4">
                  <h3 className="font-semibold text-gray-900">Submission Compliance</h3>
                  <p className="text-gray-600">
                    {analytics.submissionAnalysis.lateCount > 0
                      ? `${analytics.submissionAnalysis.lateCount} students submitted late. Consider extending the due date if this is a trend.`
                      : 'All students submitted on time. Great job with deadline management!'}
                  </p>
                </div>
                <div className="border-l-4 border-purple-600 pl-4">
                  <h3 className="font-semibold text-gray-900">Recommendation</h3>
                  <p className="text-gray-600">
                    {analytics.averageScore < 70
                      ? 'Consider reviewing course material as the class average is below 70%. Additional support may be needed.'
                      : 'Class performance is strong. Continue with current teaching strategies.'}
                  </p>
                </div>
              </div>

              {/* Export Button */}
              <div className="mt-8">
                <button
                  onClick={handleExportReport}
                  disabled={exporting}
                  className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FiDownload /> {exporting ? 'Exporting...' : 'Export Excel'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">Analytics have not been generated yet.</p>
            <p className="text-gray-500 text-sm">Generate analytics to see detailed insights about student performance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
