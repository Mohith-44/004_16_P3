import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.tsx';
import { analyticsApi, extractApiError } from '../services/api.ts';
import type { AnalyticsOverviewResponse } from '../types/index.ts';
import {
  HOSPITAL_ZONES,
  REPORT_CATEGORIES,
  REPORT_PRIORITIES,
  REPORT_STATUSES,
} from '../utils/constants.ts';
import { KpiCard } from '../components/KpiCard.tsx';

const CATEGORY_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  Urgent: '#EA580C',
  Routine: '#0F2942',
  Supply: '#4F46E5',
  Maintenance: '#7C3AED',
};

const RESOLVED_COLORS = ['#16A34A', '#EA580C'];

export function AnalyticsDashboardPage() {
  const { showToast } = useToast();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('All');
  const [zone, setZone] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<AnalyticsOverviewResponse | null>(null);
  const [categoryData, setCategoryData] = useState<
    Array<{ category: string; count: number; resolved: number }>
  >([]);
  const [zoneData, setZoneData] = useState<
    Array<{ zone: string; count: number; critical: number; resolved: number }>
  >([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        category: category !== 'All' ? category : undefined,
        zone: zone !== 'All' ? zone : undefined,
        priority: priority !== 'All' ? priority : undefined,
        status: status !== 'All' ? status : undefined,
      };

      const [ovRes, catRes, zoneRes] = await Promise.all([
        analyticsApi.overview(params),
        analyticsApi.categories(params),
        analyticsApi.zones(params),
      ]);

      setOverviewData(ovRes.data);
      setCategoryData(catRes.data.categories);
      setZoneData(zoneRes.data.zones);
    } catch (err) {
      showToast('Failed to load analytics', extractApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, category, zone, priority, status, showToast]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategory('All');
    setZone('All');
    setPriority('All');
    setStatus('All');
  };

  const ov = overviewData?.overview;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Hospital Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Live MongoDB aggregations across wards, report categories, priorities, and resolution velocity.
          </p>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="All">All Categories</option>
            {REPORT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Hospital Zone</label>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="All">All Zones</option>
            {HOSPITAL_ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="All">All Priorities</option>
            {REPORT_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Filtered Reports"
          value={ov?.totalReports ?? 0}
          subtitle={`${ov?.unresolvedReports ?? 0} open / unresolved`}
          icon={BarChart3}
          tone="indigo"
        />
        <KpiCard
          label="Critical Alerts"
          value={ov?.criticalReports ?? 0}
          subtitle="Life-safety & high-acuity alerts"
          icon={AlertTriangle}
          tone="red"
        />
        <KpiCard
          label="Resolution Rate"
          value={`${ov?.resolutionRate ?? 0}%`}
          subtitle={`${ov?.resolvedReports ?? 0} resolved reports`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <KpiCard
          label="Avg Resolution Time"
          value={`${ov?.avgResolutionHours ?? 0}h`}
          subtitle="Mean submission-to-resolve"
          icon={Clock}
          tone="navy"
        />
      </div>

      {/* Progress Indicators */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Resolution Progress Breakdown
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {ov?.resolvedReports ?? 0} of {ov?.totalReports ?? 0} reports resolved
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          {ov && ov.totalReports > 0 && (
            <>
              <div
                className="bg-emerald-600 h-full"
                style={{ width: `${(ov.resolvedReports / ov.totalReports) * 100}%` }}
                title={`Resolved: ${ov.resolvedReports}`}
              />
              <div
                className="bg-indigo-600 h-full"
                style={{ width: `${(ov.inProgressReports / ov.totalReports) * 100}%` }}
                title={`In Progress: ${ov.inProgressReports}`}
              />
              <div
                className="bg-sky-600 h-full"
                style={{ width: `${(ov.assignedReports / ov.totalReports) * 100}%` }}
                title={`Assigned: ${ov.assignedReports}`}
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${(ov.pendingReports / ov.totalReports) * 100}%` }}
                title={`Pending: ${ov.pendingReports}`}
              />
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600">
          <span>Resolved: <strong className="font-mono tabular-nums text-emerald-700">{ov?.resolvedReports ?? 0}</strong></span>
          <span>In Progress: <strong className="font-mono tabular-nums text-indigo-700">{ov?.inProgressReports ?? 0}</strong></span>
          <span>Assigned: <strong className="font-mono tabular-nums text-sky-700">{ov?.assignedReports ?? 0}</strong></span>
          <span>Pending: <strong className="font-mono tabular-nums text-amber-700">{ov?.pendingReports ?? 0}</strong></span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
          Aggregating live MongoDB analytics...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Daily Report Submission Trends (Line Chart) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Daily Report Submission Trends
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Daily total vs resolved and critical alert submissions
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overviewData?.dailyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total Submitted"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#16A34A"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="critical"
                    name="Critical"
                    stroke="#DC2626"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Resolved vs Unresolved Reports (Pie Chart) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Resolved vs Unresolved Reports
            </h3>
            <p className="text-xs text-slate-500 mb-4">Completion ratio for active filter</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overviewData?.resolvedVsUnresolved || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {(overviewData?.resolvedVsUnresolved || []).map((_, idx) => (
                      <Cell key={idx} fill={RESOLVED_COLORS[idx % RESOLVED_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 1. Zone-wise Report Distribution (Bar Chart) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Zone-wise Report Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Alert volume and resolved counts across hospital wings
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="zone" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="Total Reports" fill="#0F2942" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="critical" name="Critical" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Category-wise Report Distribution (Pie Chart) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Category-wise Report Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Critical, Urgent, Routine, Supply, and Maintenance breakdown
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category] || '#4F46E5'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Priority-wise Report Distribution */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Priority-wise Report Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">Report volume by urgency level</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData?.priorityDistribution || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis
                    type="category"
                    dataKey="priority"
                    width={64}
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" name="Reports" radius={[0, 4, 4, 0]}>
                    {(overviewData?.priorityDistribution || []).map((item) => (
                      <Cell
                        key={item.priority}
                        fill={
                          item.priority === 'Critical'
                            ? '#DC2626'
                            : item.priority === 'High'
                            ? '#EA580C'
                            : item.priority === 'Medium'
                            ? '#4F46E5'
                            : '#64748B'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6. Weekly Report Statistics */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Weekly Report Statistics
            </h3>
            <p className="text-xs text-slate-500 mb-4">Weekly resolved vs unresolved volume</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData?.weeklyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#16A34A" />
                  <Bar dataKey="unresolved" name="Unresolved" stackId="a" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 7. Department-wise Report Distribution */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Department-wise Report Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">Load across response teams</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData?.departmentDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickFormatter={(v: string) => v.split(' ')[0]}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" name="Total" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
