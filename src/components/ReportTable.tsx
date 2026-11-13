import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import type { Report } from '../types/index.ts';
import { formatDateTime } from '../utils/formatters.ts';
import { CategoryLabel, PriorityLabel, StatusLabel } from './StatusLabels.tsx';

interface ReportTableProps {
  reports: Report[];
  loading?: boolean;
  compact?: boolean;
  emptyActionLabel?: string;
  emptyActionTo?: string;
}

export function ReportTable({
  reports,
  loading = false,
  compact = false,
  emptyActionLabel = 'Submit Ward Report',
  emptyActionTo = '/submit-report',
}: ReportTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="px-5 py-4 flex items-center justify-between gap-4 animate-pulse">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-28 bg-slate-100 rounded hidden md:block" />
            <div className="h-4 w-24 bg-slate-100 rounded hidden lg:block" />
            <div className="h-6 w-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="py-14 px-6 text-center">
        <div className="w-11 h-11 mx-auto rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-900">No matching ward reports</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Try adjusting your search query or filter criteria, or submit a new clinical ward alert report.
        </p>
        <Link
          to={emptyActionTo}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] transition-colors"
        >
          {emptyActionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const cellPad = compact ? 'py-2.5 px-4' : 'py-3.5 px-4';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
            <th className="py-3 px-4 whitespace-nowrap">Report ID</th>
            <th className="py-3 px-4 whitespace-nowrap">Category</th>
            <th className="py-3 px-4 whitespace-nowrap">Hospital Zone</th>
            <th className="py-3 px-4 whitespace-nowrap">Priority</th>
            <th className="py-3 px-4 whitespace-nowrap">Submission Date</th>
            <th className="py-3 px-4 whitespace-nowrap">Department</th>
            <th className="py-3 px-4 whitespace-nowrap">Assigned Handler</th>
            <th className="py-3 px-4 whitespace-nowrap">Status</th>
            <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {reports.map((report) => (
            <tr key={report._id} className="hover:bg-slate-50/80 transition-colors">
              <td className={`${cellPad} whitespace-nowrap`}>
                <Link
                  to={`/reports/${report._id}`}
                  className="font-mono text-xs font-semibold text-[#0F2942] hover:underline tabular-nums"
                >
                  {report.reportId}
                </Link>
                <div className="text-xs text-slate-500 truncate max-w-[190px] mt-0.5">
                  {report.alertType}
                </div>
              </td>
              <td className={`${cellPad} whitespace-nowrap`}>
                <CategoryLabel category={report.category} />
              </td>
              <td className={`${cellPad} whitespace-nowrap`}>
                <span className="text-xs font-medium text-slate-800">{report.zone}</span>
                <div className="text-xs text-slate-500">{report.wardIdentifier}</div>
              </td>
              <td className={`${cellPad} whitespace-nowrap`}>
                <PriorityLabel priority={report.priority} />
              </td>
              <td className={`${cellPad} whitespace-nowrap text-xs font-mono tabular-nums text-slate-600`}>
                {formatDateTime(report.submittedAt)}
              </td>
              <td className={`${cellPad} whitespace-nowrap text-xs text-slate-700`}>
                {report.department || 'Unassigned'}
              </td>
              <td className={`${cellPad} whitespace-nowrap text-xs text-slate-700`}>
                {report.assignedHandlerName || 'Unassigned'}
              </td>
              <td className={`${cellPad} whitespace-nowrap`}>
                <StatusLabel status={report.status} />
              </td>
              <td className={`${cellPad} whitespace-nowrap text-right`}>
                <Link
                  to={`/reports/${report._id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
