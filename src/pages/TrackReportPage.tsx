import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Activity, AlertCircle, CheckCircle2, Clock, Search, UserCheck } from 'lucide-react';
import { extractApiError, reportsApi } from '../services/api.ts';
import type { Report } from '../types/index.ts';
import { formatDateTime } from '../utils/formatters.ts';
import { CategoryLabel, PriorityLabel, StatusLabel } from '../components/StatusLabels.tsx';
import { StatusTimeline } from '../components/StatusTimeline.tsx';

const SAMPLE_IDS = ['RPT-20261113-1001', 'RPT-20261113-1002', 'RPT-20261113-1003', 'RPT-20261112-1005'];
const WORKFLOW_STEPS = ['Pending', 'Assigned', 'In Progress', 'Resolved'] as const;

export function TrackReportPage({ publicMode = false }: { publicMode?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [reportIdInput, setReportIdInput] = useState(initialId);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const performLookup = useCallback(async (lookupId: string) => {
    const cleaned = lookupId.trim().toUpperCase();
    if (!cleaned) {
      setError('Please enter a Report ID to track.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { data } = await reportsApi.track(cleaned);
      setReport(data.report);
    } catch (err) {
      setReport(null);
      setError(extractApiError(err, `No report found matching "${cleaned}".`));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialId) {
      void performLookup(initialId);
    }
  }, [initialId, performLookup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = reportIdInput.trim().toUpperCase();
    if (!cleaned) {
      setError('Please enter a Report ID.');
      return;
    }
    setSearchParams({ id: cleaned });
    void performLookup(cleaned);
  };

  const currentStepIdx = report ? WORKFLOW_STEPS.indexOf(report.status) : -1;

  const content = (
    <div className="max-w-4xl mx-auto space-y-6">
      {publicMode && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F2942] text-white flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base text-slate-900">
              Hospital Ward Alert Dispatcher
            </span>
          </div>
          <Link
            to="/login"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C]"
          >
            Staff Sign In
          </Link>
        </div>
      )}

      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Track Ward Report</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your unique Report ID to inspect live assignment progress, handler updates, and resolution status.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={reportIdInput}
              onChange={(e) => setReportIdInput(e.target.value.toUpperCase())}
              placeholder="Enter Unique Report ID (e.g. RPT-20261113-1001)"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F2942]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Track Report'}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Quick Lookup:</span>
          {SAMPLE_IDS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setReportIdInput(sample);
                setSearchParams({ id: sample });
                void performLookup(sample);
              }}
              className="font-mono text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Live Tracking Result */}
      {report && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xl font-bold text-[#0F2942] tabular-nums">
                    {report.reportId}
                  </span>
                  <CategoryLabel category={report.category} />
                  <StatusLabel status={report.status} />
                </div>
                <p className="mt-1 text-sm text-slate-700 font-medium">
                  {report.alertType} · {report.hospitalWard} ({report.zone})
                </p>
              </div>
              {!publicMode && (
                <Link
                  to={`/reports/${report._id}`}
                  className="px-3.5 py-2 text-xs font-semibold text-[#0F2942] border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Open Full Details
                </Link>
              )}
            </div>

            {/* 4-Stage Progress Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {WORKFLOW_STEPS.map((step, idx) => {
                const completed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const Icon =
                  step === 'Resolved'
                    ? CheckCircle2
                    : step === 'Assigned'
                    ? UserCheck
                    : Clock;
                return (
                  <div
                    key={step}
                    className={`p-3.5 rounded-lg border transition-colors ${
                      completed
                        ? isCurrent
                          ? 'bg-[#0F2942] text-white border-[#0F2942]'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono tabular-nums">0{idx + 1}</span>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="mt-2 text-xs font-semibold">{step}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-500">Assigned Department</p>
                <p className="mt-1 font-semibold text-slate-900">{report.department}</p>
              </div>
              <div>
                <p className="text-slate-500">Assigned Handler</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {report.assignedHandlerName || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Priority</p>
                <div className="mt-1">
                  <PriorityLabel priority={report.priority} />
                </div>
              </div>
              <div>
                <p className="text-slate-500">Submitted Time</p>
                <p className="mt-1 font-mono tabular-nums text-slate-900">
                  {formatDateTime(report.submittedAt)}
                </p>
              </div>
            </div>

            {report.resolutionNotes && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <span className="font-semibold">Resolution Notes: </span>
                {report.resolutionNotes}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-slate-900 mb-5">
              Status Audit Trail
            </h2>
            <StatusTimeline history={report.statusHistory} />
          </div>
        </div>
      )}
    </div>
  );

  if (publicMode) {
    return <div className="min-h-screen bg-slate-50 p-6 sm:p-10">{content}</div>;
  }

  return content;
}
