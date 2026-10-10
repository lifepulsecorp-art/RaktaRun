import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'default',
  children,
  ...props
}) => {
  const variantStyles = {
    default:
      'border-transparent bg-rose-600 text-white shadow-sm',
    secondary:
      'border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    destructive:
      'border-transparent bg-red-500/15 text-red-600 border border-red-500/30 dark:text-red-400',
    outline:
      'text-slate-800 border border-slate-200 dark:text-slate-200 dark:border-slate-800',
    success:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border',
    warning:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 border',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

