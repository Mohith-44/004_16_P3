import React, { useState } from 'react';
import { KeyRound, Save, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { authApi, extractApiError } from '../services/api.ts';
import { HOSPITAL_DEPARTMENTS } from '../utils/constants.ts';
import { formatDateTime, getInitials } from '../utils/formatters.ts';

export function UserProfilePage() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    department: user?.department || 'Nursing Supervisor',
    ward: user?.ward || '',
    phone: user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const { data } = await authApi.updateProfile(profileForm);
      setUser(data.user);
      showToast('Profile saved', 'Your staff profile details have been updated.', 'success');
    } catch (err) {
      showToast('Update failed', extractApiError(err), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      showToast('Invalid password', 'New password must be at least 6 characters.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Mismatch', 'New password and confirmation do not match.', 'error');
      return;
    }

    try {
      setSavingPassword(true);
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed', 'Your account password has been updated.', 'success');
    } catch (err) {
      showToast('Password change failed', extractApiError(err), 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">User Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your hospital staff identity, department assignment, and account security.
        </p>
      </div>

      {/* Identity Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#0F2942] text-white font-display font-bold text-lg flex items-center justify-center shrink-0">
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">
              {user?.email} · {user?.department}
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2942]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{user?.role}</span>
            </div>
          </div>
        </div>
        {user?.createdAt && (
          <div className="text-xs text-slate-500">
            Member since{' '}
            <span className="font-mono tabular-nums text-slate-700">
              {formatDateTime(user.createdAt)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Form */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#0F2942]" />
            <h3 className="font-display text-base font-semibold text-slate-900">
              Staff Information
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
            <select
              value={profileForm.department}
              onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
            >
              {HOSPITAL_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value="General Nursing">General Nursing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Primary Ward / Station
            </label>
            <input
              type="text"
              value={profileForm.ward}
              onChange={(e) => setProfileForm({ ...profileForm, ward: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact Phone
            </label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </form>

        {/* Password Change Form */}
        <form
          onSubmit={handleChangePassword}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0F2942]" />
            <h3 className="font-display text-base font-semibold text-slate-900">
              Update Password
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Min. 6 characters"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] disabled:opacity-60"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
