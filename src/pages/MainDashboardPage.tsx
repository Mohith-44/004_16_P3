import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  FilePlus2,
  Search,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { extractApiError, reportsApi } from '../services/api.ts';
import type { Report, ReportSummaryStats } from '../types/index.ts';
import {
  REPORT_CATEGORIES,
  REPORT_PRIORITIES,
  REPORT_STATUSES,
} from '../utils/constants.ts';
import { KpiCard } from '../components/KpiCard.tsx';
import { ReportTable } from '../components/ReportTable.tsx';

export function MainDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<ReportSummaryStats>({
    totalReports: 0,
    pendingReports: 0,
    assignedReports: 0,
    assignedOnlyReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
  });
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [scope, setScope] = useState<'all' | 'mine'>('all');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await reportsApi.list({
        q: searchQuery.trim() || undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        mine: scope === 'mine' ? 'true' : undefined,
        limit: 25,
      });
      setReports(data.reports);
      setSummary(data.summary);
    } catch (err) {
      showToast('Failed to load reports', extractApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, priorityFilter, statusFilter, scope, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDashboardData();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {user?.role} · {user?.ward || user?.department} — Overview of ward alerts and resolution progress.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/track"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track Report ID</span>
          </Link>
          <Link
            to="/submit-report"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] transition-colors whitespace-nowrap"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>Submit New Report</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Reports"
          value={summary.totalReports}
          subtitle="All submitted ward alerts"
          icon={ClipboardList}
          tone="navy"
        />
        <KpiCard
          label="Pending Reports"
          value={summary.pendingReports}
          subtitle="Awaiting handler assignment"
          icon={Clock}
          tone="amber"
        />
        <KpiCard
          label="Assigned & Active"
          value={summary.assignedReports}
          subtitle={`${summary.assignedOnlyReports} Assigned · ${summary.inProgressReports} In Progress`}
          icon={UserCheck}
          tone="sky"
        />
        <KpiCard
          label="Resolved Reports"
          value={summary.resolvedReports}
          subtitle="Completed and verified"
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      {/* Reports Filter & Table Surface */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Ward Alert Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Search by unique Report ID or filter across category, priority, and workflow status.
              </p>
            </div>

            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  scope === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Ward Reports
              </button>
              <button
                type="button"
                onClick={() => setScope('mine')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  scope === 'mine'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Submissions
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Report ID (e.g. RPT-...) or alert"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F2942]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F2942]"
            >
              <option value="All">All Categories</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F2942]"
            >
              <option value="All">All Priorities</option>
              {REPORT_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F2942]"
            >
              <option value="All">All Statuses</option>
              {REPORT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ReportTable reports={reports} loading={loading} compact={user?.preferences?.compactTables} />
      </div>
    </div>
  );
}
