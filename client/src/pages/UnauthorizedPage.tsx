import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-slate-900 dark:text-slate-100 relative transition-colors duration-200">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your current account role <span className="font-semibold text-rose-600 dark:text-rose-400 uppercase">({role || 'Unknown'})</span> does
          not have permission to view this medical portal.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            variant="default"
            onClick={() => navigate('/')}
            className="w-full gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Go to Authorized Home
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" /> Sign In with Different Account
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;

