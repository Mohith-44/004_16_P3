import { CheckCircle2, Clock, UserCheck, AlertCircle } from 'lucide-react';
import type { StatusHistoryEntry } from '../types/index.ts';
import { formatDateTime } from '../utils/formatters.ts';
import { StatusLabel } from './StatusLabels.tsx';

export function StatusTimeline({ history }: { history: StatusHistoryEntry[] }) {
  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No status history entries recorded yet.
      </div>
    );
  }

  const ordered = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <ol className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
      {ordered.map((entry, idx) => {
        const Icon =
          entry.updatedStatus === 'Resolved'
            ? CheckCircle2
            : entry.updatedStatus === 'In Progress'
            ? Clock
            : entry.updatedStatus === 'Assigned'
            ? UserCheck
            : AlertCircle;

        const iconBg =
          entry.updatedStatus === 'Resolved'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : entry.updatedStatus === 'In Progress'
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : entry.updatedStatus === 'Assigned'
            ? 'bg-sky-50 text-sky-700 border-sky-200'
            : 'bg-amber-50 text-amber-700 border-amber-200';

        return (
          <li key={entry._id || `${entry.timestamp}-${idx}`} className="relative pl-11">
            <span
              className={`absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-lg border ${iconBg}`}
            >
              <Icon className="h-4 w-4" />
            </span>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">{entry.previousStatus}</span>
                <span className="text-xs text-slate-400" aria-hidden="true">
                  →
                </span>
                <StatusLabel status={entry.updatedStatus} />
              </div>
              <time className="text-xs font-mono tabular-nums text-slate-500">
                {formatDateTime(entry.timestamp)}
              </time>
            </div>

            <div className="mt-1.5 text-sm text-slate-700 leading-relaxed">
              {entry.remarks || `Transitioned to ${entry.updatedStatus}`}
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{entry.updatedBy}</span>
              {entry.updatedByRole && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{entry.updatedByRole}</span>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
