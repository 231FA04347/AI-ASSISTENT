import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiUser, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const getInitials = (firstName = '', lastName = '') => {
  const a = (firstName || '').trim();
  const b = (lastName || '').trim();
  const first = a ? a[0] : '';
  const second = b ? b[0] : '';
  const initials = (first + second).toUpperCase();
  return initials || 'U';
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    profilePicture: '',
    className: '',
  });

  const roleLabel = useMemo(() => {
    if (user?.role === 'teacher') return 'Teacher';
    if (user?.role === 'student') return 'Student';
    return 'User';
  }, [user?.role]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const res = await authAPI.getProfile();
        const profile = res.data;
        if (cancelled) return;

        setForm({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          bio: profile.bio || '',
          profilePicture: profile.profilePicture || '',
          className: profile.className || '',
        });
      } catch (e) {
        toast.error(e?.response?.data?.message || e?.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async (e) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    if (user?.role === 'student' && !String(form.className || '').trim()) {
      toast.error('Class is required for students');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        bio: form.bio,
        profilePicture: form.profilePicture || null,
      };

      if (user?.role === 'student') {
        payload.className = String(form.className).trim();
      }

      const res = await authAPI.updateProfile(payload);
      toast.success(res.data?.message || 'Profile updated');

      await refreshProfile();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 text-gray-700">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(user?.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-semibold"
            >
              <FiArrowLeft /> Back
            </button>
            <div className="hidden sm:block h-6 w-px bg-gray-200" />
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile card */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4">
              {form.profilePicture ? (
                <img
                  src={form.profilePicture}
                  alt="Profile"
                  className="w-14 h-14 rounded-full object-cover border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  {getInitials(form.firstName, form.lastName)}
                </div>
              )}

              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">
                  {form.firstName} {form.lastName}
                </p>
                <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  <FiUser /> {roleLabel}
                  {user?.role === 'student' && form.className ? (
                    <span className="text-gray-500">• Class {form.className}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Bio</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[2.5rem]">
                {form.bio?.trim() ? form.bio : 'No bio yet.'}
              </p>
            </div>
          </div>

          {/* Right: Edit form */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-end">
              {!editMode && (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold px-3 py-1 rounded transition border border-blue-100"
                >
                  <FiEdit2 /> Edit
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">Update your personal information.</p>

            <form onSubmit={onSave} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    required
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    required
                    disabled={!editMode}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  value={user?.email || ''}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-600"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-2">Email can’t be changed.</p>
              </div>

              {user?.role === 'student' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={form.className}
                    onChange={(e) => setForm((p) => ({ ...p, className: String(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                    required
                    disabled={!editMode}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture URL (optional)</label>
                <input
                  value={form.profilePicture}
                  onChange={(e) => setForm((p) => ({ ...p, profilePicture: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                  disabled={!editMode}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio (optional)</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  rows={5}
                  placeholder="Tell us a bit about yourself..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                  disabled={!editMode}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editMode) setEditMode(false);
                    else navigate(user?.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-5 py-2 rounded-lg font-semibold transition"
                >
                  {editMode ? 'Cancel' : 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={saving || !editMode}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                >
                  <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
