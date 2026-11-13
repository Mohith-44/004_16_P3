export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatShortDate(value?: string | Date | null): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeTime(value?: string | Date | null): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function getInitials(name?: string): string {
  if (!name) return 'HW';
  const parts = name
    .replace(/,.*$/, '')
    .trim()
    .split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getCategoryStyle(category: string): string {
  switch (category) {
    case 'Critical':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'Urgent':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'Supply':
      return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'Maintenance':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'Routine':
    default:
      return 'text-slate-700 bg-slate-100 border-slate-200';
  }
}

export function getPriorityStyle(priority: string): string {
  switch (priority) {
    case 'Critical':
      return 'text-red-700 font-semibold';
    case 'High':
      return 'text-orange-700 font-semibold';
    case 'Medium':
      return 'text-sky-800 font-medium';
    case 'Low':
    default:
      return 'text-slate-600 font-medium';
  }
}

export function getStatusStyle(status: string): string {
  switch (status) {
    case 'Pending':
      return 'text-amber-800 bg-amber-50 border-amber-200';
    case 'Assigned':
      return 'text-sky-800 bg-sky-50 border-sky-200';
    case 'In Progress':
      return 'text-indigo-800 bg-indigo-50 border-indigo-200';
    case 'Resolved':
      return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    default:
      return 'text-slate-700 bg-slate-100 border-slate-200';
  }
}

export function getAvailabilityStyle(availability: string): string {
  switch (availability) {
    case 'Available':
      return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    case 'Busy':
      return 'text-orange-800 bg-orange-50 border-orange-200';
    case 'On Break':
      return 'text-amber-800 bg-amber-50 border-amber-200';
    case 'Off Duty':
    default:
      return 'text-slate-600 bg-slate-100 border-slate-200';
  }
}
