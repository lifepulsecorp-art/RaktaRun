import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Shield, Building2, Users, AlertCircle, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { profile, logout } = useAuth();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { Promise.all([api.get('/admin/telemetry'), api.get('/admin/audit-logs')]).then(([stats, audit]) => { setTelemetry(stats.data); setLogs(audit.data.logs); }).catch((e) => console.error('Admin telemetry unavailable', e)); }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 font-bold text-white shadow-lg shadow-rose-600/30">
              LP
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none text-white">LifePulse Command Center</h1>
              <span className="text-xs text-rose-400 font-medium">Udupi & Dakshina Kannada Emergency Network</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{profile?.name || 'LifePulse Administrator'}</p>
              <span className="inline-block rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400">
                System Admin
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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">District Verification & Governance</h2>
          <p className="text-sm text-slate-400">Live dispatch governance, district telemetry and audit history across Udupi and Dakshina Kannada.</p>
        </div>

        {/* Phase 1 Core Action Modules (Blocks F & I) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-10">
          {/* Block F Card */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400">
                  Block F
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">Hospital Accreditation Auditing</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Review pending blood bank licenses, verify emergency contacts, and approve hospital authorities to dispatch emergency requests.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-semibold">3 Facilities Registered</span>
              <Link
                to="/admin/hospitals"
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition"
              >
                Open Audit Portal <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Block I Card */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                  Block I
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">Donor Certificate Verification</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Audit uploaded hospital digital screening certificates, verify donor vitals (Hb, weight), and activate donor eligibility for emergency matching.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-blue-400 font-semibold">5 Medically Screened Donors</span>
              <Link
                to="/admin/donors"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition"
              >
                Inspect Certificates <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Accredited Hospitals</span>
              <Building2 className="h-5 w-5 text-rose-500" />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-white">{telemetry?.totals.hospitals ?? '—'}</p>
            <span className="mt-1 inline-block text-xs text-emerald-400">Udupi & Dakshina Kannada</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Verified Donors</span>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-white">{telemetry?.totals.verifiedDonors ?? '—'}</p>
            <span className="mt-1 inline-block text-xs text-blue-400">Hospital Screened</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Active Requests</span>
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-white">{telemetry?.totals.activeRequests ?? '—'}</p>
            <span className="mt-1 inline-block text-xs text-amber-400">Across both districts</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">District Compliance</span>
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-white">{telemetry?.totals.completedDonations ?? '—'}</p>
            <span className="mt-1 inline-block text-xs text-emerald-400">Completed donations</span>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">District pilot telemetry</h3><p className="text-xs text-slate-400">Operational totals, updated when this page loads.</p></div><span className="text-xs text-slate-500">{telemetry?.totals.donorsEnRoute ?? 0} donors en route</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{(telemetry?.byDistrict || []).map((row:any)=><div key={row.district} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><p className="font-semibold">{row.district}</p><p className="mt-1 text-sm text-slate-400">{row.activeRequests} active requests</p></div>)}</div></section>
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h3 className="text-lg font-bold">Recent audit events</h3><div className="mt-4 divide-y divide-slate-800">{logs.slice(0,12).map((log:any)=><div key={log.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="text-slate-200">{log.action.replace(/[._]/g,' ')} <span className="text-slate-500">· {log.entityType} {log.entityId}</span></span><time className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</time></div>)}{logs.length===0&&<p className="py-3 text-sm text-slate-500">No audit events recorded yet.</p>}</div></section>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
