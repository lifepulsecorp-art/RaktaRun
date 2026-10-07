import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldCheck, Heart, LogOut, BellRing, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DonorDashboardPage: React.FC = () => {
  const { profile, roleData, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 font-bold text-white shadow-lg shadow-rose-600/30">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none text-white">LifePulse Hero Portal</h1>
              <span className="text-xs text-rose-400 font-medium">Medically Verified Donor Network</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/donor/register"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <UserCheck className="h-3.5 w-3.5 text-rose-400" /> Medical Certificate & Profile (Block H)
            </Link>
            <div className="text-right">
              <p className="text-sm font-medium text-white">{roleData?.fullName || profile?.name || 'Verified Donor'}</p>
              <span className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                Blood Group: {roleData?.bloodGroup || 'O+'} Verified
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Emergency Readiness & Hero Status</h2>
            <p className="text-sm text-slate-400">
              Real-time emergency matching readiness for Udupi & Dakshina Kannada.
            </p>
          </div>
          <Link
            to="/donor/register"
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition self-start sm:self-auto"
          >
            Update Screening Certificate →
          </Link>
        </div>

        {/* Hero Card */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="font-bold text-white">Hospital Certificate</h3>
            </div>
            <p className="mt-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">Certificate ID</p>
            <p className="font-mono text-sm font-bold text-white">{roleData?.verification?.certificateId || 'LP-CERT-2025-00841'}</p>
            <p className="mt-3 text-xs text-slate-400">Verified by: {roleData?.verification?.hospitalName || 'Kasturba Hospital, Manipal'}</p>
            <p className="text-xs text-slate-500 mt-1">Medical Officer: {roleData?.verification?.verifiedBy || 'Dr. Anand Kumar'}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-400">
              <Award className="h-6 w-6" />
              <h3 className="font-bold text-white">Hero Badges</h3>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(roleData?.heroStats?.badges || ['life_pulse_hero', 'rapid_responder']).map((b: string) => (
                <span key={b} className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                  🏆 {b.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">Total Lives Impacted: {roleData?.heroStats?.totalEmergencyResponses || 4}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <BellRing className="h-6 w-6" />
              <h3 className="font-bold text-white">Emergency Status</h3>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-sm font-semibold text-emerald-400 capitalize">
                {roleData?.availabilityStatus || 'Available'}
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Locality: {roleData?.homeLocality || 'Manipal, Udupi'} • Radius: {roleData?.preferredRadius || 15} km
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DonorDashboardPage;
