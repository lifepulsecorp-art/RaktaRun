import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', loading = false, isLoading, disabled, children, ...props }, ref) => {
    const isSpinnerActive = loading || isLoading || false;
    const variantStyles = {
      default:
        'bg-rose-600 text-white shadow-md shadow-rose-950/20 hover:bg-rose-500 active:scale-[0.98] dark:bg-rose-600 dark:hover:bg-rose-500',
      destructive:
        'bg-red-600 text-white shadow-md shadow-red-950/20 hover:bg-red-500 active:scale-[0.98]',
      outline:
        'border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white',
      secondary:
        'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
      ghost:
        'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
      link:
        'text-rose-600 underline-offset-4 hover:underline dark:text-rose-400 p-0 h-auto',
    };

    const sizeStyles = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-8 rounded-lg px-3 text-xs',
      lg: 'h-12 rounded-xl px-6 text-base font-bold',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isSpinnerActive}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isSpinnerActive && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
