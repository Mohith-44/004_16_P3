import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  FilePlus2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { extractApiError, reportsApi } from '../services/api.ts';
import type { Report, ReportCategory, ReportPriority } from '../types/index.ts';
import {
  ALERT_TYPE_SUGGESTIONS,
  HOSPITAL_DEPARTMENTS,
  HOSPITAL_ZONES,
  REPORT_CATEGORIES,
  REPORT_PRIORITIES,
} from '../utils/constants.ts';
import { formatDateTime } from '../utils/formatters.ts';
import { CategoryLabel, PriorityLabel, StatusLabel } from '../components/StatusLabels.tsx';

function makeSuggestedReportId(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RPT-${datePart}-${random}`;
}

export function SubmitReportPage() {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    reporterName: user?.name || '',
    reporterEmail: user?.email || '',
    contactNumber: user?.phone || '',
    hospitalWard: user?.ward || '',
    wardIdentifier: '',
    zone: user?.preferences?.defaultZone && user.preferences.defaultZone !== 'All Zones'
      ? user.preferences.defaultZone
      : 'ICU Complex',
    reportId: makeSuggestedReportId(),
    alertCode: '',
    alertType: '',
    category: 'Urgent' as ReportCategory,
    priority: 'High' as ReportPriority,
    department: 'Nursing Supervisor',
    description: '',
    additionalNotes: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (form.reporterName.trim().length < 2) errs.reporterName = 'Reporter name is required.';
    if (!form.reporterEmail.trim() || !form.reporterEmail.includes('@')) {
      errs.reporterEmail = 'Please provide a valid email address.';
    }
    if (form.contactNumber.trim().length < 7) {
      errs.contactNumber = 'Please enter a valid contact number.';
    }
    if (!form.hospitalWard.trim()) errs.hospitalWard = 'Hospital ward is required.';
    if (!form.wardIdentifier.trim()) errs.wardIdentifier = 'Ward identifier is required.';
    if (!form.zone) errs.zone = 'Please select a hospital zone.';
    if (!form.alertCode.trim()) errs.alertCode = 'Relevant alert code is required.';
    if (!form.alertType.trim()) errs.alertType = 'Alert type is required.';
    if (form.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCategoryChange = (cat: ReportCategory) => {
    let defaultDept = form.department;
    if (cat === 'Critical') defaultDept = 'Biomedical Engineering';
    else if (cat === 'Supply') defaultDept = 'Pharmacy';
    else if (cat === 'Maintenance') defaultDept = 'Maintenance Department';
    else defaultDept = 'Nursing Supervisor';

    setForm((prev) => ({ ...prev, category: cat, department: defaultDept }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Validation error', 'Please review the highlighted form fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await reportsApi.create({
        ...form,
        reportId: form.reportId.trim() || undefined,
      });
      setSubmittedReport(data.report);
      showToast('Report submitted', `Tracking ID ${data.report.reportId} generated.`, 'success');
      void refreshNotifications();
    } catch (err) {
      const msg = extractApiError(err, 'Failed to submit ward report.');
      showToast('Submission failed', msg, 'error');
      if (msg.toLowerCase().includes('report id')) {
        setFieldErrors((prev) => ({ ...prev, reportId: msg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForNewSubmission = () => {
    setSubmittedReport(null);
    setFieldErrors({});
    setForm((prev) => ({
      ...prev,
      wardIdentifier: '',
      reportId: makeSuggestedReportId(),
      alertCode: '',
      alertType: '',
      description: '',
      additionalNotes: '',
    }));
  };

  if (submittedReport) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-emerald-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">
                Ward Alert Report Submitted
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Your report has been saved to the hospital dispatch database and logged for routing.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-500">Unique Report ID</p>
              <p className="mt-1 font-mono text-lg font-bold text-[#0F2942] tabular-nums">
                {submittedReport.reportId}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Current Report Status</p>
              <div className="mt-1.5">
                <StatusLabel status={submittedReport.status} />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Reporter Information</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {submittedReport.reporterName}
              </p>
              <p className="text-xs text-slate-500">
                {submittedReport.reporterEmail} · {submittedReport.contactNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Submission Date & Time</p>
              <p className="mt-1 text-sm font-mono tabular-nums text-slate-900">
                {formatDateTime(submittedReport.submittedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Report Category & Priority</p>
              <div className="mt-1.5 flex items-center gap-3">
                <CategoryLabel category={submittedReport.category} />
                <PriorityLabel priority={submittedReport.priority} />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Ward & Target Department</p>
              <p className="mt-1 text-sm text-slate-900">
                {submittedReport.hospitalWard} ({submittedReport.zone})
              </p>
              <p className="text-xs text-slate-500">{submittedReport.department}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
            <Link
              to={`/reports/${submittedReport._id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>View Report Details</span>
            </Link>
            <Link
              to={`/track?id=${submittedReport.reportId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Open Track Page</span>
            </Link>
            <button
              type="button"
              onClick={resetForNewSubmission}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors ml-auto"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Submit Another Report</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Submit Hospital Ward Alert Report
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Log equipment failures, patient-support requests, supply shortages, or facility issues.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Section 1: Reporter Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-slate-900">
            01. Reporter Details
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Contact details of the nurse or staff member submitting this report.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reporter Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.reporterName}
                onChange={(e) => {
                  setForm({ ...form, reporterName: e.target.value });
                  setFieldErrors((p) => ({ ...p, reporterName: '' }));
                }}
                placeholder="e.g. Elena Rostova, RN"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none ${
                  fieldErrors.reporterName
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0F2942]'
                }`}
              />
              {fieldErrors.reporterName && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.reporterName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                value={form.reporterEmail}
                onChange={(e) => {
                  setForm({ ...form, reporterEmail: e.target.value });
                  setFieldErrors((p) => ({ ...p, reporterEmail: '' }));
                }}
                placeholder="nurse@hospitalward.org"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none ${
                  fieldErrors.reporterEmail
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0F2942]'
                }`}
              />
              {fieldErrors.reporterEmail && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.reporterEmail}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contact Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) => {
                  setForm({ ...form, contactNumber: e.target.value });
                  setFieldErrors((p) => ({ ...p, contactNumber: '' }));
                }}
                placeholder="+1 (555) 210-8114"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none ${
                  fieldErrors.contactNumber
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0F2942]'
                }`}
              />
              {fieldErrors.contactNumber && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.contactNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hospital Ward <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.hospitalWard}
                onChange={(e) => {
                  setForm({ ...form, hospitalWard: e.target.value });
                  setFieldErrors((p) => ({ ...p, hospitalWard: '' }));
                }}
                placeholder="e.g. Ward 3A - Cardiac ICU"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none ${
                  fieldErrors.hospitalWard
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0F2942]'
                }`}
              />
              {fieldErrors.hospitalWard && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.hospitalWard}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Report Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              02. Clinical Alert & Report Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the ward location, alert classification, urgency level, and incident description.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ward Identifier <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.wardIdentifier}
                onChange={(e) => {
                  setForm({ ...form, wardIdentifier: e.target.value });
                  setFieldErrors((p) => ({ ...p, wardIdentifier: '' }));
                }}
                placeholder="e.g. W3A-BED04"
                className={`w-full px-3.5 py-2 text-sm font-mono rounded-lg border focus:outline-none ${
                  fieldErrors.wardIdentifier
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0F2942]'
                }`}
              />
              {fieldErrors.wardIdentifier && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.wardIdentifier}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hospital Zone <span className="text-red-600">*</span>
              </label>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F2942]"
              >
                {HOSPITAL_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Report Identifier
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={form.reportId}
                  onChange={(e) => {
                    setForm({ ...form, reportId: e.target.value.toUpperCase() });
                    setFieldErrors((p) => ({ ...p, reportId: '' }));
                  }}
                  className={`w-full px-3 py-2 text-sm font-mono rounded-lg border focus:outline-none ${
                    fieldErrors.reportId
                      ? 'border-red-400 bg-red-50/40'
                      : 'border-slate-300 focus:border-[#0F2942]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, reportId: makeSuggestedReportId() }))}
                  title="Generate new unique ID"
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {fieldErrors.reportId && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.reportId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Relevant Alert Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.alertCode}
                onChange={(e) => {
                  setForm({ ...form, alertCode: e.target.value.toUpperCase() });
                  setFieldErrors((p) => ({ ...p, alertCode: '' }));
                }}
                placeholder="e.g. BIO-VENT-09"
                className={`w-full px-3.5 py-2 text-sm font-mono rounded-lg border focus:outline-none ${
                  fieldErrors.alertCode
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0F2942]'
                }`}
              />
              {fieldErrors.alertCode && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.alertCode}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alert Type <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                list="alert-type-options"
                value={form.alertType}
                onChange={(e) => {
                  setForm({ ...form, alertType: e.target.value });
                  setFieldErrors((p) => ({ ...p, alertType: '' }));
                }}
                placeholder="e.g. Ventilator Pressure Alarm"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none ${
                  fieldErrors.alertType
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0F2942]'
                }`}
              />
              <datalist id="alert-type-options">
                {ALERT_TYPE_SUGGESTIONS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              {fieldErrors.alertType && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.alertType}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Department
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F2942]"
              >
                {HOSPITAL_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5 Report Categories */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Report Category <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {REPORT_CATEGORIES.map((cat) => {
                const active = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors text-center ${
                      active
                        ? 'bg-[#0F2942] text-white border-[#0F2942]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Urgency / Priority Levels */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Urgency / Priority Level <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {REPORT_PRIORITIES.map((prio) => {
                const active = form.priority === prio;
                const activeStyle =
                  prio === 'Critical'
                    ? 'bg-red-600 text-white border-red-600'
                    : prio === 'High'
                    ? 'bg-orange-600 text-white border-orange-600'
                    : prio === 'Medium'
                    ? 'bg-[#0F2942] text-white border-[#0F2942]'
                    : 'bg-slate-700 text-white border-slate-700';

                return (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => setForm({ ...form, priority: prio })}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      active
                        ? activeStyle
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {prio}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Incident Description <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => {
                setForm({ ...form, description: e.target.value });
                setFieldErrors((p) => ({ ...p, description: '' }));
              }}
              placeholder="Describe the equipment malfunction, supply shortage, maintenance failure, or patient-support alert in detail..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border focus:outline-none ${
                fieldErrors.description
                  ? 'border-red-400 bg-red-50/40'
                  : 'border-slate-300 focus:border-[#0F2942]'
              }`}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Additional Notes
            </label>
            <textarea
              rows={2}
              value={form.additionalNotes}
              onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
              placeholder="Optional backup equipment status, patient precautions, or ward access instructions..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F2942]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] disabled:opacity-60 transition-colors"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>{submitting ? 'Submitting Report...' : 'Submit Ward Report'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
