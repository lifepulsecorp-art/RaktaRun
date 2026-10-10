import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  withSidebar?: boolean;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  containerClassName?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  withSidebar,
  title,
  subtitle,
  badge,
  actions,
  containerClassName = '',
}) => {
  const { firebaseUser, role } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Automatically enable sidebar for authenticated portal pages unless explicitly set to false
  const showSidebar = withSidebar !== undefined ? withSidebar : Boolean(firebaseUser && role);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        showSidebarToggle={showSidebar}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className="flex flex-1">
        {/* Responsive Collapsible Sidebar */}
        {showSidebar && (
          <Sidebar
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {(title || actions) && (
            <div className="border-b border-slate-200/80 bg-white/50 px-4 sm:px-6 lg:px-8 py-5 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/30">
              <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    {title && (
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-display">
                        {title}
                      </h1>
                    )}
                    {badge}
                  </div>
                  {subtitle && (
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && <div className="flex items-center gap-2.5">{actions}</div>}
              </div>
            </div>
          )}

          <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${containerClassName}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
