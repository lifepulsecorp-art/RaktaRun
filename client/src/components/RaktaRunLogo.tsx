import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RaktaRunLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  animate?: boolean;
  className?: string;
}

export const RaktaRunLogo: React.FC<RaktaRunLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  showSubtitle,
  animate = false,
  className = '',
}) => {
  const { firebaseUser, role } = useAuth();
  const dashboardPath = role === 'admin' ? '/admin' : role === 'hospital' ? '/hospital' : '/donor';
  const destination = firebaseUser && role ? dashboardPath : '/';
  const label = firebaseUser && role ? 'Go to your dashboard' : 'Go to RaktaRun home';

  const sizeMap = {
    sm: { box: 'h-8 w-8', icon: 32, text: 'text-base', sub: 'hidden sm:inline text-[9px]' },
    md: { box: 'h-10 w-10', icon: 40, text: 'text-lg', sub: 'hidden sm:inline text-[11px]' },
    lg: { box: 'h-12 w-12', icon: 48, text: 'text-xl', sub: 'text-xs' },
    xl: { box: 'h-16 w-16', icon: 64, text: 'text-3xl', sub: 'text-sm' },
  };

  const current = sizeMap[size];
  const displaySubtitle = showSubtitle === false ? undefined : (subtitle || (showSubtitle ? 'Emergency Blood Network' : undefined));

  return (
    <Link
      to={destination}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-3 select-none ${className}`}
    >
      <img
        src="/raktarun-mark.png"
        alt=""
        aria-hidden="true"
        className={`${current.box} object-contain ${animate ? 'animate-heart-pulse' : ''}`}
      />

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${current.text} font-display`}>
              Rakta<span className="text-blue-700 dark:text-blue-400">Run</span>
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
    </Link>
  );
};
