import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  tone?: 'navy' | 'amber' | 'sky' | 'emerald' | 'red' | 'indigo';
}

export function KpiCard({ label, value, subtitle, icon: Icon, tone = 'navy' }: KpiCardProps) {
  const iconColors: Record<string, string> = {
    navy: 'bg-slate-100 text-[#0F2942]',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-display font-bold text-slate-900 tabular-nums tracking-tight">
          {value}
        </p>
        {subtitle && <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColors[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
