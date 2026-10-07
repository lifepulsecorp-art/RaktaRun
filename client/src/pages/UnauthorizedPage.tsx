import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-400">
          Your current account role <span className="font-semibold text-rose-400 uppercase">({role || 'Unknown'})</span> does
          not have permission to view this medical portal.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> Go to Authorized Home
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sign In with Different Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;

