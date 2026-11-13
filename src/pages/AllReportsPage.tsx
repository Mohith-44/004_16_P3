import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, RotateCcw, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { extractApiError, reportsApi } from '../services/api.ts';
import type { Report } from '../types/index.ts';
import {
  HOSPITAL_DEPARTMENTS,
  HOSPITAL_ZONES,
  REPORT_CATEGORIES,
  REPORT_PRIORITIES,
  REPORT_STATUSES,
} from '../utils/constants.ts';
import { ReportTable } from '../components/ReportTable.tsx';

export function AllReportsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [zone, setZone] = useState('All');
  const [department, setDepartment] = useState('All');

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await reportsApi.list({
        q: q.trim() || undefined,
        category: category !== 'All' ? category : undefined,
        priority: priority !== 'All' ? priority : undefined,
        status: status !== 'All' ? status : undefined,
        zone: zone !== 'All' ? zone : undefined,
        department: department !== 'All' ? department : undefined,
        limit: 100,
      });
      setReports(data.reports);
      setTotal(data.pagination.total);
    } catch (err) {
      showToast('Error loading reports', extractApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [q, category, priority, status, zone, department, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadReports();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadReports]);

  const clearFilters = () => {
    setQ('');
    setCategory('All');
    setPriority('All');
    setStatus('All');
    setZone('All');
    setDepartment('All');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">All Ward Reports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Showing <span className="font-mono tabular-nums font-semibold">{total}</span> hospital ward
            reports stored in MongoDB.
          </p>
        </div>
        <Link
          to="/submit-report"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          <FilePlus2 className="w-3.5 h-3.5" />
          <span>New Ward Report</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by Report ID, reporter name, ward identifier, alert code, or description..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F2942]"
              />
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            >
              <option value="All">All Categories</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            >
              <option value="All">All Priorities</option>
              {REPORT_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            >
              <option value="All">All Statuses</option>
              {REPORT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            >
              <option value="All">All Zones</option>
              {HOSPITAL_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white col-span-2 sm:col-span-1"
            >
              <option value="All">All Departments</option>
              {HOSPITAL_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
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
