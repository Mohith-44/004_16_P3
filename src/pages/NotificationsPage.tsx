import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { formatDateTime } from '../utils/formatters.ts';

export function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const visibleNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleMarkAll = async () => {
    await markAllAsRead();
    showToast('Notifications cleared', 'All notifications marked as read.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time alerts for report submissions, handler assignments, status updates, and resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAll()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
        {loading && notifications.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading notifications...</div>
        ) : visibleNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-800">No notifications to display</p>
            <p className="mt-1 text-xs text-slate-500">
              {filter === 'unread'
                ? 'You have read all incoming ward alert notifications.'
                : 'New ward submissions and updates will appear here.'}
            </p>
          </div>
        ) : (
          visibleNotifications.map((n) => {
            const Icon =
              n.severity === 'critical' || n.severity === 'urgent'
                ? AlertTriangle
                : n.severity === 'resolved'
                ? CheckCircle2
                : Info;

            const iconTone =
              n.severity === 'critical'
                ? 'bg-red-50 text-red-600 border-red-200'
                : n.severity === 'urgent'
                ? 'bg-orange-50 text-orange-600 border-orange-200'
                : n.severity === 'resolved'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-sky-50 text-sky-700 border-sky-200';

            return (
              <div
                key={n._id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  !n.isRead ? 'bg-sky-50/30' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${iconTone}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{n.title}</h3>
                      {!n.isRead && (
                        <span className="text-[11px] font-semibold text-[#0F2942] bg-sky-100 px-1.5 py-0.5 rounded">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <p className="mt-1.5 text-[11px] font-mono tabular-nums text-slate-400">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(n.reportRef || n.reportId) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!n.isRead) void markAsRead(n._id);
                        if (n.reportRef) navigate(`/reports/${n.reportRef}`);
                        else if (n.reportId) navigate(`/track?id=${n.reportId}`);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-[#0F2942] border border-slate-200 rounded-lg hover:bg-slate-100 whitespace-nowrap"
                    >
                      Open Report
                    </button>
                  )}
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => void markAsRead(n._id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
