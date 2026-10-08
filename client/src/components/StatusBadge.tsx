
export function StatusBadge({ status }: { status: string }) {
  let color = 'text-slate-400';
  let dotColor = 'bg-slate-400';

  if (status === 'ACTIVE') {
    color = 'text-emerald-400';
    dotColor = 'bg-emerald-400';
  } else if (status === 'MAINTENANCE') {
    color = 'text-amber-400';
    dotColor = 'bg-amber-400';
  } else if (status === 'DECOMMISSIONED') {
    color = 'text-rose-400';
    dotColor = 'bg-rose-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}