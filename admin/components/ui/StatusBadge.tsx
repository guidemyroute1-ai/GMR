type StatusVariant =
  | 'active'
  | 'inactive'
  | 'blocked'
  | 'verified'
  | 'pending'
  | 'suspended'
  | 'draft'
  | 'under_review'
  | 'archived'
  | 'completed'
  | 'confirmed'
  | 'cancelled';

const variantMap: Record<StatusVariant, { bg: string; text: string; dot: string; label: string }> = {
  active:       { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Active' },
  inactive:     { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400',   label: 'Inactive' },
  blocked:      { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Blocked' },
  verified:     { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Verified' },
  pending:      { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending' },
  suspended:    { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Suspended' },
  draft:        { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400',   label: 'Draft' },
  under_review: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Under Review' },
  archived:     { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400',  label: 'Archived' },
  completed:    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Completed' },
  confirmed:    { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Confirmed' },
  cancelled:    { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Cancelled' },
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const variant = variantMap[status as StatusVariant] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: status };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${variant.bg} ${variant.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${variant.dot}`} />
      {variant.label}
    </span>
  );
}
