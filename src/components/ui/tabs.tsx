import { cn } from '@/lib/utils';

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex w-full rounded-lg bg-slate-800/60 p-1', className)}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function TabsTrigger({ active, className, ...props }: TabsTriggerProps) {
  return (
    <button
      role="tab"
      aria-selected={active}
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        active
          ? 'bg-slate-700 text-slate-100 shadow-sm'
          : 'text-slate-400 hover:text-slate-300',
        className,
      )}
      {...props}
    />
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export function TabsContent({ active, className, ...props }: TabsContentProps) {
  if (!active) return null;
  return (
    <div
      role="tabpanel"
      className={cn('mt-4', className)}
      {...props}
    />
  );
}
