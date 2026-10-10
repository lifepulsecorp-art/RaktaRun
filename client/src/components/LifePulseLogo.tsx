import React from 'react';

interface LifePulseLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  animate?: boolean;
  className?: string;
}

export const LifePulseLogo: React.FC<LifePulseLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  showSubtitle,
  animate = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'h-8 w-8', icon: 32, text: 'text-base', sub: 'text-[9px]' },
    md: { box: 'h-10 w-10', icon: 40, text: 'text-lg', sub: 'text-[11px]' },
    lg: { box: 'h-12 w-12', icon: 48, text: 'text-xl', sub: 'text-xs' },
    xl: { box: 'h-16 w-16', icon: 64, text: 'text-3xl', sub: 'text-sm' },
  };

  const current = sizeMap[size];
  const displaySubtitle = showSubtitle === false ? undefined : (subtitle || (showSubtitle ? 'Emergency Blood Network' : undefined));

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Visual Mark */}
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 shadow-lg shadow-rose-600/30 ring-1 ring-white/20 ${current.box} ${
          animate ? 'animate-heart-pulse' : ''
        }`}
      >
        <svg
          viewBox="0 0 64 64"
          className="h-full w-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Heart Shape contour */}
          <path
            d="M32 10 C32 10 20 2 12 10 C4 18 4 30 14 42 L32 58 L50 42 C60 30 60 18 52 10 C44 2 32 10 32 10 Z"
            fill="rgba(255, 255, 255, 0.12)"
          />

          {/* LifePulse ECG Wave */}
          <path
            d="M12 36 L22 36 L25 30 L29 42 L34 24 L38 40 L41 36 L52 36"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center pulse node */}
          <circle cx="34" cy="24" r="2.5" fill="#fecdd3" />
        </svg>

        {/* Ambient glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-rose-400/20 blur-md pointer-events-none -z-10" />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${current.text} font-display`}>
              Life<span className="text-rose-600 dark:text-rose-500">Pulse</span>
            </span>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Grid Active" />
          </div>
          {displaySubtitle && (
            <span className={`font-medium text-slate-500 dark:text-slate-400 leading-tight ${current.sub}`}>
              {displaySubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
