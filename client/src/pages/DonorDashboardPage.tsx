import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldCheck, Heart, LogOut, BellRing, UserCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export const DonorDashboardPage: React.FC = () => {
  const { profile, roleData, logout } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [busyId, setBusyId] = useState('');
  const [now, setNow] = useState(Date.now());
  const [consent, setConsent] = useState(Boolean(roleData?.publicHeroConsent));
  const refreshAlerts = useCallback(async () => {
    try { const { data } = await api.get('/donors/me/alerts'); setAlerts(data.filter((entry: any) => entry.match.status === 'alerted')); }
    catch { /* keep the last alert snapshot visible while the API reconnects */ }
  }, []);
  useEffect(() => { refreshAlerts(); const poll = setInterval(refreshAlerts, 5000); const clock = setInterval(() => setNow(Date.now()), 1000); return () => { clearInterval(poll); clearInterval(clock); }; }, [refreshAlerts]);
  const respond = async (matchId: string, response: 'accepted' | 'declined') => {
    setBusyId(matchId);
    try { await api.post(`/donors/matches/${matchId}/respond`, { response }); setAlerts((current) => current.filter((item) => item.match.id !== matchId)); if (response === 'accepted') navigate(`/live-tracking/${alerts.find((item) => item.match.id === matchId)?.request?.id}`); }
    catch (error: any) { window.alert(error.response?.data?.error || 'Could not respond to alert.'); await refreshAlerts(); }
    finally { setBusyId(''); }
  };
  const setPublicConsent = async (enabled: boolean) => {
    setConsent(enabled);
    try { await api.put('/donors/me/public-hero-consent', { enabled }); }
    catch { setConsent(!enabled); }
  };

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
                Blood Group: {roleData?.bloodGroup || '—'} Verified
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
            <p className="font-mono text-sm font-bold text-white">{roleData?.verification?.certificateId || 'Awaiting verification'}</p>
            <p className="mt-3 text-xs text-slate-400">Verified by: {roleData?.verification?.hospitalName || '—'}</p>
            <p className="text-xs text-slate-500 mt-1">Medical Officer: {roleData?.verification?.verifiedBy || '—'}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-400">
              <Award className="h-6 w-6" />
              <h3 className="font-bold text-white">Hero Badges</h3>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(roleData?.heroStats?.badges || []).map((b: string) => (
                <span key={b} className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                  🏆 {b.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">Completed donations: {roleData?.heroStats?.totalDonations || 0}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <BellRing className="h-6 w-6" />
              <h3 className="font-bold text-white">Emergency Status</h3>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-sm font-semibold text-emerald-400 capitalize">
                {roleData?.availabilityStatus || 'Unavailable'}
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Locality: {roleData?.homeLocality || 'Not set'} • Radius: {roleData?.preferredRadius || 15} km
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-bold text-white">Public Hero Wall</h3><p className="mt-1 text-sm text-slate-400">Your profile appears only if you opt in. The wall shows your name, district, blood group and donation totals.</p></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setPublicConsent(e.target.checked)}/> Show my hero profile</label></div>
          <Link className="mt-3 inline-block text-sm text-rose-300 hover:text-rose-200" to="/hero-wall">View the Hero Wall →</Link>
        </section>
      </main>

      {alerts.length > 0 && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl shadow-rose-950/40">
        <div className="flex items-center gap-3"><BellRing className="h-7 w-7 text-rose-400"/><div><p className="text-xs font-bold uppercase tracking-widest text-rose-300">Emergency donor alert</p><h2 className="text-xl font-bold">A nearby hospital needs help</h2></div></div>
        {alerts.map(({ match, request }) => { const seconds = Math.max(0, Math.ceil((Date.parse(match.alertExpiresAt || match.alertedAt) - now) / 1000)); return <article key={match.id} className="mt-5 rounded-xl border border-slate-700 bg-slate-950/70 p-4"><div className="flex items-start justify-between"><div><p className="text-lg font-bold text-white">{request?.bloodGroup} · {request?.component?.replace('_',' ')}</p><p className="mt-1 text-sm text-slate-300">{request?.hospitalName}</p><p className="text-xs text-slate-400">Approx. {match.distance} km away · {request?.urgency}</p></div><span className="rounded-lg bg-amber-500/10 px-3 py-2 font-mono text-sm text-amber-300">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</span></div><div className="mt-4 flex gap-3"><button disabled={!seconds || !!busyId} onClick={() => respond(match.id,'accepted')} className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-semibold text-white disabled:opacity-50">{busyId===match.id?'Sending…':'Accept & share location'}</button><button disabled={!!busyId} onClick={() => respond(match.id,'declined')} className="rounded-lg border border-slate-700 px-5 py-2.5 font-semibold text-slate-300">Decline</button></div></article>; })}
        <p className="mt-4 text-xs text-slate-500">Precise location sharing starts only after you accept and grant browser location access.</p>
      </div></div>}
    </div>
  );
};

export default DonorDashboardPage;
