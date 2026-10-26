import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AssignmentDetail from './pages/AssignmentDetail';
import SubmissionDetail from './pages/SubmissionDetail';
import GradingPage from './pages/GradingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, initializing } = useAuth();

  if (initializing) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Token exists but profile isn't loaded yet (or failed)
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} />;
  }

  return children;
};

function AppRoutes() {
  const { isAuthenticated, user, initializing } = useAuth();

  if (initializing) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={user?.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to={user?.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} />} />
      
      <Route path="/teacher-dashboard" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/student-dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/assignment/:id" element={<ProtectedRoute><AssignmentDetail /></ProtectedRoute>} />
      <Route path="/submission/:id" element={<ProtectedRoute><SubmissionDetail /></ProtectedRoute>} />
      <Route path="/grading/:assignmentId" element={<ProtectedRoute requiredRole="teacher"><GradingPage /></ProtectedRoute>} />
      <Route path="/analytics/:assignmentId" element={<ProtectedRoute requiredRole="teacher"><AnalyticsPage /></ProtectedRoute>} />
      
      <Route path="/" element={<Navigate to={isAuthenticated ? (user?.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard') : '/login'} />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
