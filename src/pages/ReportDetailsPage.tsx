import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail, Phone, Save, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { extractApiError, handlersApi, reportsApi } from '../services/api.ts';
import type { HandlerProfile, Report, ReportStatus } from '../types/index.ts';
import { HOSPITAL_DEPARTMENTS, REPORT_STATUSES } from '../utils/constants.ts';
import { formatDateTime } from '../utils/formatters.ts';
import { CategoryLabel, PriorityLabel, StatusLabel } from '../components/StatusLabels.tsx';
import { StatusTimeline } from '../components/StatusTimeline.tsx';

export function ReportDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const { showToast } = useToast();

  const [report, setReport] = useState<Report | null>(null);
  const [handlers, setHandlers] = useState<HandlerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>('Pending');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedHandlerId, setSelectedHandlerId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [remarks, setRemarks] = useState('');

  const canManage =
    user?.role === 'Admin' || user?.role === 'Handler' || user?.role === 'Routing Manager';

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [reportRes, handlersRes] = await Promise.all([
        reportsApi.getById(id),
        handlersApi.list(),
      ]);
      const r = reportRes.data.report;
      setReport(r);
      setHandlers(handlersRes.data.handlers);
      setSelectedStatus(r.status);
      setSelectedDepartment(r.department || 'Nursing Supervisor');
      setSelectedHandlerId(
        typeof r.assignedHandler === 'object' && r.assignedHandler
          ? r.assignedHandler._id
          : typeof r.assignedHandler === 'string'
          ? r.assignedHandler
          : ''
      );
      setResolutionNotes(r.resolutionNotes || '');
    } catch (err) {
      showToast('Failed to load report', extractApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    try {
      setSaving(true);
      const { data } = await reportsApi.update(report._id, {
        status: selectedStatus,
        department: selectedDepartment,
        assignedHandler: selectedHandlerId || null,
        resolutionNotes,
        remarks: remarks.trim() || undefined,
      });
      setReport(data.report);
      setRemarks('');
      showToast('Report updated', `${data.report.reportId} updated successfully.`, 'success');
      void refreshNotifications();
    } catch (err) {
      showToast('Update failed', extractApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
        Loading ward report details...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <h2 className="font-display text-lg font-semibold text-slate-900">Report Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">
          The requested ward report could not be located.
        </p>
        <Link
          to="/reports"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg"
        >
          Back to All Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Reports</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {report.reportId}
            </h1>
            <CategoryLabel category={report.category} />
            <StatusLabel status={report.status} />
          </div>
          <p className="text-sm text-slate-600">
            {report.alertType} · <span className="font-mono text-xs">{report.alertCode}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Report Details & Status History Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Clinical Incident Overview
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-500">Hospital Ward</p>
                <p className="mt-1 font-semibold text-slate-900">{report.hospitalWard}</p>
              </div>
              <div>
                <p className="text-slate-500">Ward Identifier</p>
                <p className="mt-1 font-mono font-semibold text-slate-900">{report.wardIdentifier}</p>
              </div>
              <div>
                <p className="text-slate-500">Hospital Zone</p>
                <p className="mt-1 font-semibold text-slate-900">{report.zone}</p>
              </div>
              <div>
                <p className="text-slate-500">Priority Level</p>
                <div className="mt-1">
                  <PriorityLabel priority={report.priority} />
                </div>
              </div>
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
                <p className="text-slate-500">Submitted At</p>
                <p className="mt-1 font-mono tabular-nums text-slate-900">
                  {formatDateTime(report.submittedAt)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Last Updated</p>
                <p className="mt-1 font-mono tabular-nums text-slate-900">
                  {formatDateTime(report.updatedAt)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Resolved At</p>
                <p className="mt-1 font-mono tabular-nums text-slate-900">
                  {formatDateTime(report.resolvedAt)}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-700">Incident Description</p>
                <p className="mt-1 text-sm text-slate-800 leading-relaxed">{report.description}</p>
              </div>
              {report.additionalNotes && (
                <div>
                  <p className="text-xs font-semibold text-slate-700">Additional Notes</p>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {report.additionalNotes}
                  </p>
                </div>
              )}
              {report.resolutionNotes && (
                <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolution Notes
                  </p>
                  <p className="mt-1 text-sm text-emerald-900 leading-relaxed">
                    {report.resolutionNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Visual Status History Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-slate-900 mb-1">
              Status History Timeline
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Chronological audit log of status changes, assignees, and remarks.
            </p>
            <StatusTimeline history={report.statusHistory} />
          </div>
        </div>

        {/* Right Column: Reporter Info & Management Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Reporter Contact
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="font-semibold text-slate-900">{report.reporterName}</div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{report.reporterEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono tabular-nums">{report.contactNumber}</span>
              </div>
            </div>
          </div>

          {canManage && (
            <form
              onSubmit={handleSaveUpdate}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0F2942]" />
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Manage Report Status & Assignment
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
                >
                  {REPORT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assigned Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
                >
                  {HOSPITAL_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assigned Handler
                </label>
                <select
                  value={selectedHandlerId}
                  onChange={(e) => setSelectedHandlerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
                >
                  <option value="">Unassigned</option>
                  {handlers.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} ({h.department} · {h.availability} · {h.currentWorkload}/{h.maxCapacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Document parts replaced, restock quantities, or resolution steps..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Timeline Update Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional note added to status timeline"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] disabled:opacity-60 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Changes...' : 'Save Report Update'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
