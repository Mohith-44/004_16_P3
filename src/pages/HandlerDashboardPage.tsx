import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Search, UserCheck, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { extractApiError, handlersApi, reportsApi } from '../services/api.ts';
import type { HandlerAvailability, HandlerProfile, Report, ReportStatus } from '../types/index.ts';
import { HANDLER_AVAILABILITIES, HOSPITAL_ZONES, REPORT_STATUSES } from '../utils/constants.ts';
import { formatDateTime } from '../utils/formatters.ts';
import {
  AvailabilityLabel,
  CategoryLabel,
  PriorityLabel,
  StatusLabel,
} from '../components/StatusLabels.tsx';
import { Modal } from '../components/Modal.tsx';

export function HandlerDashboardPage() {
  const { user, handlerProfile, setHandlerProfile } = useAuth();
  const { refreshNotifications } = useNotifications();
  const { showToast } = useToast();

  const [handlers, setHandlers] = useState<HandlerProfile[]>([]);
  const [selectedHandlerId, setSelectedHandlerId] = useState<string>('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState('All');

  // Capacity editor
  const [capacityInput, setCapacityInput] = useState<number>(6);
  const [updatingHandler, setUpdatingHandler] = useState(false);

  // Resolution / Status modal
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [modalStatus, setModalStatus] = useState<ReportStatus>('In Progress');
  const [modalNotes, setModalNotes] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const activeHandler = handlers.find((h) => h._id === selectedHandlerId) || handlers[0] || null;

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const [handlersRes, reportsRes] = await Promise.all([
        handlersApi.list(),
        reportsApi.list({ limit: 100 }),
      ]);
      const allHandlers = handlersRes.data.handlers;
      setHandlers(allHandlers);

      const defaultHandler =
        (handlerProfile && allHandlers.find((h) => h._id === handlerProfile._id)) ||
        allHandlers.find((h) => h.email === user?.email) ||
        allHandlers[0];

      if (defaultHandler && !selectedHandlerId) {
        setSelectedHandlerId(defaultHandler._id);
        setCapacityInput(defaultHandler.maxCapacity);
      }

      setReports(reportsRes.data.reports);
    } catch (err) {
      showToast('Failed to load handler workspace', extractApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [handlerProfile, user?.email, selectedHandlerId, showToast]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (activeHandler) {
      setCapacityInput(activeHandler.maxCapacity);
    }
  }, [activeHandler]);

  const handleAvailabilityChange = async (availability: HandlerAvailability) => {
    if (!activeHandler) return;
    try {
      setUpdatingHandler(true);
      const { data } = await handlersApi.updateAvailability(activeHandler._id, availability);
      setHandlers((prev) => prev.map((h) => (h._id === activeHandler._id ? { ...h, availability: data.handler.availability } : h)));
      if (handlerProfile?._id === activeHandler._id) {
        setHandlerProfile(data.handler);
      }
      showToast('Availability updated', `${activeHandler.name} is now ${availability}.`, 'success');
    } catch (err) {
      showToast('Update failed', extractApiError(err), 'error');
    } finally {
      setUpdatingHandler(false);
    }
  };

  const handleCapacitySave = async () => {
    if (!activeHandler) return;
    try {
      setUpdatingHandler(true);
      const { data } = await handlersApi.updateCapacity(activeHandler._id, capacityInput);
      setHandlers((prev) =>
        prev.map((h) => (h._id === activeHandler._id ? { ...h, maxCapacity: data.handler.maxCapacity } : h))
      );
      if (handlerProfile?._id === activeHandler._id) {
        setHandlerProfile(data.handler);
      }
      showToast('Capacity saved', `Maximum workload set to ${data.handler.maxCapacity} reports.`, 'success');
    } catch (err) {
      showToast('Update failed', extractApiError(err), 'error');
    } finally {
      setUpdatingHandler(false);
    }
  };

  const openStatusModal = (report: Report, initialStatus?: ReportStatus) => {
    setActiveReport(report);
    setModalStatus(initialStatus || report.status);
    setModalNotes(report.resolutionNotes || '');
    setModalRemarks('');
  };

  const handleUpdateReportStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;

    try {
      setSavingStatus(true);
      const { data } = await reportsApi.updateStatus(activeReport._id, {
        status: modalStatus,
        resolutionNotes: modalNotes,
        remarks: modalRemarks.trim() || undefined,
        assignedHandler:
          !activeReport.assignedHandler && activeHandler ? activeHandler._id : undefined,
      });

      setReports((prev) => prev.map((r) => (r._id === activeReport._id ? data.report : r)));
      setActiveReport(null);
      showToast('Status updated', `${data.report.reportId} marked as ${modalStatus}.`, 'success');
      void loadWorkspace();
      void refreshNotifications();
    } catch (err) {
      showToast('Status update failed', extractApiError(err), 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  const visibleReports = reports.filter((r) => {
    const handlerId =
      typeof r.assignedHandler === 'object' && r.assignedHandler
        ? r.assignedHandler._id
        : typeof r.assignedHandler === 'string'
        ? r.assignedHandler
        : '';

    const belongsToHandlerOrDept =
      !activeHandler ||
      handlerId === activeHandler._id ||
      (r.status === 'Pending' && r.department === activeHandler.department);

    if (!belongsToHandlerOrDept) return false;
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (zoneFilter !== 'All' && r.zone !== zoneFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.reportId.toLowerCase().includes(q) ||
        r.alertType.toLowerCase().includes(q) ||
        r.reporterName.toLowerCase().includes(q) ||
        r.hospitalWard.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const utilizationPct = activeHandler
    ? Math.min(100, Math.round((activeHandler.currentWorkload / activeHandler.maxCapacity) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Hospital Handler Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage assigned ward alerts, update resolution progress, and configure handler availability & capacity.
          </p>
        </div>

        {handlers.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Active Handler Profile:
            </label>
            <select
              value={activeHandler?._id || ''}
              onChange={(e) => setSelectedHandlerId(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2942]"
            >
              {handlers.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name} · {h.department}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Handler Status & Capacity Control Panel */}
      {activeHandler && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-4 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#0F2942] text-white flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  {activeHandler.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {activeHandler.department} · {activeHandler.specialization}
                </p>
              </div>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>Current Status:</span>
              <AvailabilityLabel availability={activeHandler.availability} />
              <span>·</span>
              <span className="font-mono tabular-nums">{activeHandler.resolvedCount} resolved</span>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Handler Availability
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
              {HANDLER_AVAILABILITIES.map((avail) => (
                <button
                  key={avail}
                  type="button"
                  disabled={updatingHandler}
                  onClick={() => void handleAvailabilityChange(avail)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    activeHandler.availability === avail
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {avail}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Workload Capacity</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {activeHandler.currentWorkload} / {activeHandler.maxCapacity} Active ({utilizationPct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  utilizationPct >= 90
                    ? 'bg-red-600'
                    : utilizationPct >= 70
                    ? 'bg-orange-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${utilizationPct}%` }}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <label className="text-xs text-slate-600 whitespace-nowrap">Max Capacity:</label>
              <input
                type="number"
                min={1}
                max={50}
                value={capacityInput}
                onChange={(e) => setCapacityInput(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                className="w-20 px-2.5 py-1 text-xs font-mono tabular-nums border border-slate-300 rounded-md"
              />
              <button
                type="button"
                disabled={updatingHandler}
                onClick={() => void handleCapacitySave()}
                className="px-3 py-1 text-xs font-semibold text-white bg-[#0F2942] rounded-md hover:bg-[#163A5C] disabled:opacity-60"
              >
                Save Capacity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assigned & Department Reports Queue */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Assigned & Department Queue ({visibleReports.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Reports assigned to {activeHandler?.name || 'handler'} plus unassigned alerts in{' '}
              {activeHandler?.department || 'department'}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, ward, reporter..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="All">All Statuses</option>
              {REPORT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="All">All Zones</option>
              {HOSPITAL_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading handler reports...</div>
        ) : visibleReports.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No assigned or matching department reports right now.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Report & Time</th>
                  <th className="py-3 px-4 whitespace-nowrap">Category & Priority</th>
                  <th className="py-3 px-4 whitespace-nowrap">Ward & Zone</th>
                  <th className="py-3 px-4 whitespace-nowrap">Reporter</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {visibleReports.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        to={`/reports/${r._id}`}
                        className="font-mono font-semibold text-[#0F2942] hover:underline tabular-nums"
                      >
                        {r.reportId}
                      </Link>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 tabular-nums">
                        {formatDateTime(r.submittedAt)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                      <div>
                        <CategoryLabel category={r.category} />
                      </div>
                      <div>
                        <PriorityLabel priority={r.priority} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{r.hospitalWard}</div>
                      <div className="text-slate-500">
                        {r.zone} · <span className="font-mono">{r.wardIdentifier}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{r.reporterName}</div>
                      <div className="text-slate-500">{r.contactNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-900">{r.alertType}</div>
                      <p className="text-slate-600 line-clamp-2 mt-0.5">{r.description}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusLabel status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {r.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => openStatusModal(r, 'Assigned')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 font-medium"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </button>
                        )}
                        {r.status !== 'In Progress' && r.status !== 'Resolved' && (
                          <button
                            type="button"
                            onClick={() => openStatusModal(r, 'In Progress')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 font-medium"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>In Progress</span>
                          </button>
                        )}
                        {r.status !== 'Resolved' && (
                          <button
                            type="button"
                            onClick={() => openStatusModal(r, 'Resolved')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Resolve</span>
                          </button>
                        )}
                        <Link
                          to={`/reports/${r._id}`}
                          className="px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status & Resolution Notes Modal */}
      <Modal
        isOpen={Boolean(activeReport)}
        onClose={() => setActiveReport(null)}
        title={`Update Report ${activeReport?.reportId || ''}`}
        subtitle={activeReport ? `${activeReport.alertType} · ${activeReport.hospitalWard}` : ''}
      >
        <form onSubmit={handleUpdateReportStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Status</label>
            <select
              value={modalStatus}
              onChange={(e) => setModalStatus(e.target.value as ReportStatus)}
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
              Resolution Notes
            </label>
            <textarea
              rows={3}
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
              placeholder="Enter action taken, replacement parts used, or resolution verification..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status Remarks (Timeline Entry)
            </label>
            <input
              type="text"
              value={modalRemarks}
              onChange={(e) => setModalRemarks(e.target.value)}
              placeholder="Brief status update note..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveReport(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingStatus}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] disabled:opacity-60"
            >
              {savingStatus ? 'Updating...' : `Mark as ${modalStatus}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
