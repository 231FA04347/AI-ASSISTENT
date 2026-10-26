import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI, submissionAPI } from '../utils/api';
import { FiCheckCircle, FiClock, FiLogOut, FiSend, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentAPI.getStudentAssignments();
      setAssignments(response.data);
    } catch (error) {
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (assignment) => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    
    if (assignment.submitted) {
      return { status: 'Submitted', color: 'green', icon: FiCheckCircle };
    } else if (now > dueDate) {
      return { status: 'Overdue', color: 'red', icon: FiClock };
    } else {
      return { status: 'Pending', color: 'orange', icon: FiClock };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-200 transition"
            >
              <FiUser /> Profile
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Assignments</p>
            <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-600">{assignments.filter(a => a.submitted).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{assignments.filter(a => !a.submitted).length}</p>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Assignments</h2>
          {loading ? (
            <p className="text-gray-600">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="text-gray-600">No assignments yet. Check back soon!</p>
          ) : (
            assignments.map(assignment => {
              const statusInfo = getStatus(assignment);
              const StatusIcon = statusInfo.icon;
              const colors = {
                green: 'bg-green-100 text-green-800 border-green-300',
                red: 'bg-red-100 text-red-800 border-red-300',
                orange: 'bg-orange-100 text-orange-800 border-orange-300',
              };

              return (
                <div key={assignment._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm ${colors[statusInfo.color]}`}>
                          <StatusIcon size={16} />
                          {statusInfo.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{assignment.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 items-center">
                        <span>Type: <strong>{assignment.type}</strong></span>
                        <span>Points: <strong>{assignment.totalPoints}</strong></span>
                        <span>Due: <strong>{new Date(assignment.dueDate).toLocaleDateString()}</strong></span>
                        {assignment.difficulty && (
                          <span className={`inline-block px-2 py-1 rounded text-white font-semibold text-xs 
                            ${assignment.difficulty === 'easy' ? 'bg-green-500' : assignment.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`}
                          >
                            {assignment.difficulty.charAt(0).toUpperCase() + assignment.difficulty.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/assignment/${assignment._id}`)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap"
                    >
                      <FiSend /> {assignment.submitted ? 'View' : 'Start Assignment'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
