import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { extractApiError } from '../services/api.ts';
import { HOSPITAL_DEPARTMENTS, USER_ROLES } from '../utils/constants.ts';

export function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Nurse / Reporter',
    department: 'Nursing Supervisor',
    ward: 'Ward 3A - Cardiac ICU',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.name.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!form.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        department: form.department,
        ward: form.ward.trim(),
        phone: form.phone.trim(),
      });
      showToast('Registration complete', `Account created for ${user.name}`, 'success');
      if (user.role === 'Handler') navigate('/handler-dashboard');
      else if (user.role === 'Routing Manager') navigate('/routing');
      else navigate('/dashboard');
    } catch (err) {
      setError(extractApiError(err, 'Failed to register account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 grid lg:grid-cols-12 items-stretch">
      <div className="hidden lg:flex lg:col-span-5 relative bg-[#0F2942] overflow-hidden flex-col justify-between p-10 text-white">
        {!imageFailed && (
          <img
            src="/src/assets/images/auth_hospital_ward_1794563219054.jpg"
            alt="Hospital clinical corridor"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09192B] via-[#0F2942]/75 to-[#0F2942]/60" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Hospital Ward Alert Dispatcher
          </span>
        </div>

        <div className="relative z-10 space-y-4 max-w-md">
          <h1 className="font-display text-3xl font-bold leading-tight text-balance">
            Role-based access for nurses, handlers, and routing supervisors.
          </h1>
          <p className="text-sm text-slate-200 leading-relaxed">
            Register your hospital staff credentials to submit ward reports, manage assigned alert
            queues, oversee routing rules, and review department analytics.
          </p>
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="max-w-lg w-full mx-auto">
          <h2 className="font-display text-2xl font-bold text-slate-900">Create Staff Account</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#0F2942] hover:underline">
              Sign in here
            </Link>
            .
          </p>

          {error && (
            <div className="mt-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Elena Rostova, RN"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 focus:border-[#0F2942]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="staff@hospitalward.org"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 focus:border-[#0F2942]"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Staff Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 focus:border-[#0F2942]"
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 focus:border-[#0F2942]"
                >
                  {HOSPITAL_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="General Nursing">General Nursing</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hospital Ward / Desk
                </label>
                <input
                  type="text"
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  placeholder="Ward 3A - Cardiac ICU"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 focus:border-[#0F2942]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 210-8100"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 focus:border-[#0F2942]"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 focus:border-[#0F2942]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 focus:border-[#0F2942]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#0F2942] text-white text-sm font-semibold rounded-lg hover:bg-[#163A5C] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
