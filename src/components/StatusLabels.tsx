import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Package,
  UserCheck,
  Wrench,
} from 'lucide-react';
import {
  getAvailabilityStyle,
  getCategoryStyle,
  getPriorityStyle,
  getStatusStyle,
} from '../utils/formatters.ts';

export function CategoryLabel({ category }: { category: string }) {
  const Icon =
    category === 'Critical'
      ? Flame
      : category === 'Urgent'
      ? AlertTriangle
      : category === 'Supply'
      ? Package
      : category === 'Maintenance'
      ? Wrench
      : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border whitespace-nowrap ${getCategoryStyle(
        category
      )}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{category}</span>
    </span>
  );
}

export function StatusLabel({ status }: { status: string }) {
  const Icon =
    status === 'Resolved'
      ? CheckCircle2
      : status === 'In Progress'
      ? Clock
      : status === 'Assigned'
      ? UserCheck
      : AlertTriangle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border whitespace-nowrap ${getStatusStyle(
        status
      )}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}

export function PriorityLabel({ priority }: { priority: string }) {
  return (
    <span className={`text-xs whitespace-nowrap ${getPriorityStyle(priority)}`}>
      {priority}
    </span>
  );
}

export function AvailabilityLabel({ availability }: { availability: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border whitespace-nowrap ${getAvailabilityStyle(
        availability
      )}`}
    >
      {availability}
    </span>
  );
}
