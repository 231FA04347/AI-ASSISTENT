import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    className: '10',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.role,
        formData.role === 'student' ? formData.className : undefined
      );
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
            <FiUser className="text-white text-xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join our grading system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Email</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-600">
              <FiMail className="text-gray-400 mr-2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                className="flex-1 outline-none text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">Class</label>
              <input
                type="number"
                name="className"
                value={formData.className}
                onChange={handleChange}
                min={1}
                max={12}
                placeholder="10"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Password</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-600">
              <FiLock className="text-gray-400 mr-2" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="flex-1 outline-none text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Confirm Password</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-600">
              <FiLock className="text-gray-400 mr-2" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="flex-1 outline-none text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
