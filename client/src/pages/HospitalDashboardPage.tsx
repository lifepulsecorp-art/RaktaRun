import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Send, LogOut, Settings, Building2, History, X, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export const HospitalDashboardPage: React.FC = () => {
  const { profile, roleData, logout } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const hospitalId = roleData?.id;

  // History states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<{ summary?: any; history: any[] }>({ history: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'fulfilled' | 'unfulfilled'>('all');

  const fetchHistory = async () => {
    if (!hospitalId) return;
    setLoadingHistory(true);
    try {
      const res = await api.get(`/hospitals/${hospitalId}/history`);
      setHistoryData(res.data);
    } catch (error) {
      console.error('Could not load hospital history', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal) {
      fetchHistory();
    }
  }, [showHistoryModal, hospitalId]);

  const refresh = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const { data } = await api.get(`/hospitals/${hospitalId}/requests`);
      setRequests(data);
    } catch (error) {
      console.error('Could not load requests', error);
    }
  }, [hospitalId]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-600/30">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Hospital Emergency Blood Portal</h1>
              <span className="text-xs text-rose-400 mt-1 block">{roleData?.name || 'Hospital accreditation required'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/hospital/profile"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition shadow-sm"
            >
              <Settings className="h-3.5 w-3.5 text-rose-400" /> Hospital Profile
            </Link>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-white">{profile?.name || 'Hospital staff'}</p>
              <span className="text-[11px] text-emerald-400 font-semibold">{roleData?.verificationStatus || 'profile pending'}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Emergency Dispatches</h2>
            <p className="text-sm text-slate-400">
              Create emergency requests and monitor donor responses. Exact donor location appears only after acceptance.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm active:scale-[0.98]"
            >
              <History className="h-4 w-4 text-rose-400" /> Dispatch History
            </button>
            <Link
              to="/hospital/request/new"
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition active:scale-[0.98]"
            >
              <Send className="h-4 w-4" /> New Emergency Request
            </Link>
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Active & Recent Dispatches</h3>
            <span className="text-xs text-slate-500 font-mono">Live synchronization every 10s</span>
          </div>

          {requests.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
              No emergency requests active currently. Create one when your clinical blood bank needs verified donors.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {requests.slice().reverse().map((request: any) => (
              <article key={request.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xl font-black text-rose-300">{request.bloodGroup}</p>
                    <h4 className="mt-1 font-bold text-white">{request.unitsRequired} units · {request.component?.replace('_', ' ')}</h4>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs uppercase font-bold ${
                    request.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    request.status === 'matched' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                    'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}>
                    {request.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {request.urgency} · {request.radiusKm} km radius · {new Date(request.createdAt).toLocaleString()}
                </p>
                <Link
                  to={`/live-tracking/${request.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <Send className="h-3.5 w-3.5 text-rose-400" /> View matches & live tracking →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <Link to="/hospital/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition font-medium">
            <Building2 className="h-4 w-4 text-rose-400" /> Manage hospital accreditation profile
          </Link>
          <span className="text-slate-500">LifePulse Emergency Network · Coastal Karnataka</span>
        </div>
      </main>

      {/* Hospital Dispatch History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-5 right-5 rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close history modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <History className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-1">
                  Clinical Audit Trail
                </span>
                <h2 className="text-xl font-bold text-white">Emergency Dispatch & Fulfillment History</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed record of blood emergency broadcasts, fulfilled units, and donor completions at {roleData?.name || 'this facility'}.
                </p>
              </div>
            </div>

            {/* Summary Statistics Cards */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Dispatches</span>
                <p className="text-2xl font-black text-white mt-1">{historyData.summary?.totalRequests ?? requests.length}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Broadcasted to donors</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fulfilled Requests</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">{historyData.summary?.totalFulfilled ?? 0}</p>
                <p className="text-[10px] text-emerald-300 mt-0.5">Successful transfusions</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Units Received</span>
                <p className="text-2xl font-black text-rose-400 mt-1">{historyData.summary?.totalUnitsCollected ?? 0}</p>
                <p className="text-[10px] text-rose-300 mt-0.5">Completed by hero donors</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Requests</span>
                <p className="text-2xl font-black text-sky-400 mt-1">{historyData.summary?.activeRequests ?? 0}</p>
                <p className="text-[10px] text-sky-300 mt-0.5">Currently in matching</p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="mt-6 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`rounded-lg px-3 py-1.5 transition ${statusFilter === 'all' ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'}`}
                >
                  All ({historyData.history.length})
                </button>
                <button
                  onClick={() => setStatusFilter('fulfilled')}
                  className={`rounded-lg px-3 py-1.5 transition ${statusFilter === 'fulfilled' ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'}`}
                >
                  Fulfilled ({historyData.history.filter((h: any) => h.status === 'fulfilled').length})
                </button>
                <button
                  onClick={() => setStatusFilter('unfulfilled')}
                  className={`rounded-lg px-3 py-1.5 transition ${statusFilter === 'unfulfilled' ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'}`}
                >
                  Unfulfilled / Expired ({historyData.history.filter((h: any) => ['unfulfilled', 'expired', 'cancelled'].includes(h.status)).length})
                </button>
              </div>

              <button
                onClick={fetchHistory}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                Refresh Log
              </button>
            </div>

            {/* History Table / Cards */}
            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
              {loadingHistory && (
                <div className="py-8 text-center text-xs text-slate-400">Loading hospital dispatch history…</div>
              )}

              {!loadingHistory && historyData.history.length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-xs text-slate-400">
                  No historical dispatch records found for this hospital.
                </div>
              )}

              {!loadingHistory && historyData.history
                .filter((r: any) => {
                  if (statusFilter === 'fulfilled') return r.status === 'fulfilled';
                  if (statusFilter === 'unfulfilled') return ['unfulfilled', 'expired', 'cancelled'].includes(r.status);
                  return true;
                })
                .map((r: any) => (
                  <article
                    key={r.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-rose-400 text-lg">{r.bloodGroup}</span>
                          <span className="font-bold text-white text-sm">
                            {r.unitsRequired} {r.unitsRequired === 1 ? 'unit' : 'units'} · {r.component?.replace('_', ' ')}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            r.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            r.status === 'unfulfilled' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>{new Date(r.createdAt).toLocaleString()}</span>
                          <span className="text-slate-600">·</span>
                          <span>Ward: {r.patientInfo?.ward || 'ICU / Emergency'}</span>
                          <span className="text-slate-600">·</span>
                          <span>Doctor: {r.patientInfo?.doctor || 'Clinical In-Charge'}</span>
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-xs font-bold text-slate-300">
                          {r.totalDonated || 0} / {r.unitsRequired} Units Donated
                        </span>
                        <div className="mt-1">
                          <Link
                            to={`/live-tracking/${r.id}`}
                            className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:underline"
                          >
                            View Tracking Details →
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Donors who fulfilled */}
                    {r.donors && r.donors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                          <Users className="h-3 w-3 text-emerald-400" /> Donors Donated:
                        </span>
                        {r.donors.map((d: any, idx: number) => (
                          <span
                            key={d.donorId || idx}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] text-emerald-300 font-medium"
                          >
                            <span>✓ {d.fullName} ({d.bloodGroup})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Hospital Clinical Record • LifePulse Karnataka
              </span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 transition border border-slate-700"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboardPage;
