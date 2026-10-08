import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Send, LogOut, Settings, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export const HospitalDashboardPage: React.FC = () => {
  const { profile, roleData, logout } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const hospitalId = roleData?.id;
  const refresh = useCallback(async () => {
    if (!hospitalId) return;
    try { const { data } = await api.get(`/hospitals/${hospitalId}/requests`); setRequests(data); }
    catch (error) { console.error('Could not load requests', error); }
  }, [hospitalId]);
  useEffect(() => { refresh(); const timer = setInterval(refresh, 10000); return () => clearInterval(timer); }, [refresh]);

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white"><HeartPulse className="h-6 w-6"/></div><div><h1 className="text-lg font-bold text-white">Hospital Emergency Blood Portal</h1><span className="text-xs text-rose-400">{roleData?.name || 'Hospital accreditation required'}</span></div></div>
      <div className="flex items-center gap-4"><Link to="/hospital/profile" className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300"><Settings className="h-3.5 w-3.5"/> Hospital profile</Link><div className="text-right"><p className="text-sm font-medium">{profile?.name || 'Hospital staff'}</p><span className="text-xs text-emerald-400">{roleData?.verificationStatus || 'profile pending'}</span></div><button onClick={logout} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold"><LogOut className="h-3.5 w-3.5"/> Sign out</button></div>
    </div></header>
    <main className="mx-auto max-w-7xl px-6 py-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold text-white">Emergency dispatches</h2><p className="text-sm text-slate-400">Create requests and monitor donor responses. Exact donor location appears only after acceptance.</p></div><Link to="/hospital/request/new" className="flex items-center gap-2 self-start rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white"><Send className="h-4 w-4"/> New emergency request</Link></div>
      <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h3 className="font-bold">Your emergency requests</h3><span className="text-xs text-slate-500">Refreshes every 10 seconds</span></div>
        {requests.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">No emergency requests yet. Create one when your blood bank needs verified donors.</div>}
        <div className="grid gap-4 md:grid-cols-2">{requests.slice().reverse().map((request:any)=><article key={request.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="flex items-start justify-between"><div><p className="text-xl font-black text-rose-300">{request.bloodGroup}</p><h4 className="mt-1 font-bold">{request.unitsRequired} units · {request.component.replace('_',' ')}</h4></div><span className="rounded-full bg-rose-500/10 px-2 py-1 text-xs uppercase text-rose-300">{request.status}</span></div><p className="mt-2 text-xs text-slate-400">{request.urgency} · {request.radiusKm} km · {new Date(request.createdAt).toLocaleString()}</p><Link to={`/live-tracking/${request.id}`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"><Send className="h-3.5 w-3.5"/> View matches and tracking</Link></article>)}</div>
      </section>
      <Link to="/hospital/profile" className="mt-8 inline-flex items-center gap-2 text-sm text-slate-400"><Building2 className="h-4 w-4"/> Manage hospital accreditation profile</Link>
    </main>
  </div>;
};

export default HospitalDashboardPage;
