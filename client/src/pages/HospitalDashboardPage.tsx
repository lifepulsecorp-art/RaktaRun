import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Send, LogOut, Settings, Building2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const HospitalDashboardPage: React.FC = () => {
  const { profile, roleData, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 font-bold text-white shadow-lg shadow-rose-600/30">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none text-white">Hospital Emergency Blood Portal</h1>
              <span className="text-xs text-rose-400 font-medium">
                {roleData?.name || 'Kasturba Hospital, Manipal'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/hospital/profile"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <Settings className="h-3.5 w-3.5" /> Edit Profile (Block G)
            </Link>
            <div className="text-right">
              <p className="text-sm font-medium text-white">{profile?.name || 'Blood Bank Officer'}</p>
              <span className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                Verified Medical Authority
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Active Emergency Dispatches</h2>
            <p className="text-sm text-slate-400">
              Hospital authority center for creating emergency blood alerts and monitoring matched donors.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/hospital/profile"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <Building2 className="h-4 w-4 text-rose-400" /> Hospital Accreditation Profile
            </Link>
            <button
              onClick={() => navigate('/live-tracking/req_emergency_001')}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition"
            >
              <Send className="h-4 w-4" /> View Sample Emergency Dispatch
            </button>
          </div>
        </div>

        {/* Sample active request card */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 text-2xl font-black">
                O+
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Trauma ICU Emergency — 2 Units Whole Blood</h3>
                  <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-400 animate-pulse">
                    CRITICAL
                  </span>
                </div>
                <p className="text-sm text-slate-400">Patient: Ramesh Hegde (42M) • Bed 4 ICU</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/live-tracking/req_emergency_001')}
                className="rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Track Live Donors (1 Accepted)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HospitalDashboardPage;
