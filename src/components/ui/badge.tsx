import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'error' | 'warning';
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        {
          default: 'bg-slate-700 text-slate-300',
          success: 'bg-green-900/60 text-green-400',
          error: 'bg-red-900/60 text-red-400',
          warning: 'bg-yellow-900/60 text-yellow-400',
        }[variant],
        className,
      )}
      {...props}
    />
  );
}
