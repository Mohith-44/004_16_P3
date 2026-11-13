import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, ArrowRight, Lock, Mail, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { extractApiError } from '../services/api.ts';

const DEMO_ACCOUNTS = [
  { role: 'Nurse / Reporter', email: 'nurse.elena@hospitalward.org', name: 'Elena Rostova, RN' },
  { role: 'Handler', email: 'handler.marcus@hospitalward.org', name: 'Marcus Vance' },
  { role: 'Routing Manager', email: 'routing.priya@hospitalward.org', name: 'Priya Deshmukh' },
  { role: 'Admin', email: 'admin@hospitalward.org', name: 'Dr. Aravind Menon' },
];

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(email.trim(), password);
      showToast('Signed in', `Welcome back, ${user.name}`, 'success');
      if (user.role === 'Handler') navigate('/handler-dashboard');
      else if (user.role === 'Routing Manager') navigate('/routing');
      else navigate('/dashboard');
    } catch (err) {
      setError(extractApiError(err, 'Invalid credentials. Please check your email and password.'));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Hospital@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 grid lg:grid-cols-12 items-stretch">
      {/* Left Visual Column */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-[#0F2942] overflow-hidden flex-col justify-between p-10 text-white">
        {!imageFailed && (
          <img
            src="/src/assets/images/auth_hospital_ward_1794563219054.jpg"
            alt="Hospital clinical nursing station corridor"
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
            Centralized clinical ward reporting and dispatch coordination.
          </h1>
          <p className="text-sm text-slate-200 leading-relaxed">
            Submit equipment malfunctions, urgent patient-support alerts, pharmacy shortages, and
            facility maintenance requests with transparent status tracking across every hospital wing.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span>Biomedical Engineering</span>
            <span aria-hidden="true">·</span>
            <span>Pharmacy</span>
            <span aria-hidden="true">·</span>
            <span>Maintenance</span>
            <span aria-hidden="true">·</span>
            <span>Nursing Supervision</span>
          </div>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-[#0F2942] text-white flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base text-slate-900">
              Hospital Ward Alert Dispatcher
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold text-slate-900">Sign in to your workspace</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Access your role-based hospital dashboard or{' '}
            <Link to="/register" className="font-semibold text-[#0F2942] hover:underline">
              create a staff account
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
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hospital Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospitalward.org"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 focus:border-[#0F2942]"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 focus:border-[#0F2942]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#0F2942] text-white text-sm font-semibold rounded-lg hover:bg-[#163A5C] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Role Demo Access */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700">Demo Role Accounts</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a role below to auto-fill credentials (password: <span className="font-mono">Hospital@123</span>).
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => fillDemoAccount(acct.email)}
                  className="text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:border-[#0F2942] hover:bg-slate-50 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-900">{acct.role}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{acct.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-600 pt-4 border-t border-slate-200">
            <span>Need to check an existing report?</span>
            <Link
              to="/track-public"
              className="inline-flex items-center gap-1.5 font-semibold text-[#0F2942] hover:underline"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track by Report ID</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
