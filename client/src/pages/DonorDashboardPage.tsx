import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldCheck, Heart, LogOut, BellRing, UserCheck, Sliders, MessageSquare, Smartphone, Bell, Clock, Compass, Camera, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const BADGE_MAP: Record<string, { label: string; icon: string }> = {
  life_pulse_hero: { label: 'LifePulse Hero', icon: '🦸' },
  rapid_responder: { label: 'Rapid Responder', icon: '⚡' },
  repeat_hero: { label: 'Repeat Hero', icon: '❤️' },
  rare_blood_hero: { label: 'Rare Blood Hero', icon: '🏅' },
  community_champion: { label: 'Community Champion', icon: '🌟' },
};

export const DonorDashboardPage: React.FC = () => {
  const { profile, roleData, logout } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [busyId, setBusyId] = useState('');
  const [now, setNow] = useState(Date.now());
  const [consent, setConsent] = useState(Boolean(roleData?.publicHeroConsent));
  const [consentNotice, setConsentNotice] = useState('');
  
  // Donor preference states
  const [preferredRadius, setPreferredRadius] = useState<number>(roleData?.preferredRadius || 15);
  const [notifPrefs, setNotifPrefs] = useState({
    push: roleData?.notificationPreferences?.push ?? true,
    sms: roleData?.notificationPreferences?.sms ?? true,
    whatsapp: roleData?.notificationPreferences?.whatsapp ?? true,
    criticalOnly: roleData?.notificationPreferences?.criticalOnly ?? false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefNotice, setPrefNotice] = useState('');

  // Emergency status controls
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'unavailable' | 'emergency_only'>(
    roleData?.availabilityStatus || 'available'
  );
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');

  const updateEmergencyStatus = async (newStatus: 'available' | 'unavailable' | 'emergency_only') => {
    setStatusUpdating(true);
    setStatusNotice('');
    try {
      await api.put('/donors/me/availability', { availabilityStatus: newStatus });
      setAvailabilityStatus(newStatus);
      setStatusNotice(`Emergency status updated to: ${newStatus === 'emergency_only' ? 'Critical Trauma Only' : newStatus}`);
      setTimeout(() => setStatusNotice(''), 3500);
    } catch {
      setStatusNotice('Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const refreshAlerts = useCallback(async () => {
    try {
      const { data } = await api.get('/donors/me/alerts');
      setAlerts(data.filter((entry: any) => entry.match.status === 'alerted'));
    } catch {
      /* Keep last alert snapshot while reconnecting */
    }
  }, []);

  useEffect(() => {
    refreshAlerts();
    const poll = setInterval(refreshAlerts, 5000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [refreshAlerts]);

  const respond = async (matchId: string, response: 'accepted' | 'declined') => {
    setBusyId(matchId);
    try {
      await api.post(`/donors/matches/${matchId}/respond`, { response });
      setAlerts((current) => current.filter((item) => item.match.id !== matchId));
      if (response === 'accepted') {
        const targetReq = alerts.find((item) => item.match.id === matchId)?.request;
        navigate(`/live-tracking/${targetReq?.id}`);
      }
    } catch (error: any) {
      window.alert(error.response?.data?.error || 'Could not respond to alert.');
      await refreshAlerts();
    } finally {
      setBusyId('');
    }
  };

  const setPublicConsent = async (enabled: boolean) => {
    setConsent(enabled);
    setConsentNotice('');
    try {
      await api.put('/donors/me/public-hero-consent', { enabled });
      setConsentNotice(enabled ? '✓ Featured on Public Hero Wall!' : 'Profile hidden from Public Wall.');
      setTimeout(() => setConsentNotice(''), 3000);
    } catch {
      setConsent(!enabled);
      setConsentNotice('Failed to update hero wall status.');
      setTimeout(() => setConsentNotice(''), 3000);
    }
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    setPrefNotice('');
    try {
      await api.put('/donors/me/preferences', {
        preferredRadius,
        notificationPreferences: notifPrefs,
      });
      setPrefNotice('Preferences updated successfully!');
      setTimeout(() => setPrefNotice(''), 3000);
    } catch (e: any) {
      setPrefNotice('Failed to update preferences.');
    } finally {
      setSavingPrefs(false);
    }
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
              <span className="text-xs text-rose-400 font-medium">Udupi & Dakshina Kannada Emergency Network</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/donor/register"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <UserCheck className="h-3.5 w-3.5 text-rose-400" /> Screening Certificate
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
              Ready to respond to hospital emergencies across coastal Karnataka.
            </p>
          </div>
          <Link
            to="/donor/register"
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition self-start sm:self-auto"
          >
            Update Screening Certificate →
          </Link>
        </div>

        {/* 3 Status Cards */}
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
              <h3 className="font-bold text-white">Hero Badges & Score</h3>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(roleData?.heroStats?.badges || []).map((b: string) => {
                const info = BADGE_MAP[b] || { label: b.replace(/_/g, ' '), icon: '🏆' };
                return (
                  <span key={b} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                    <span>{info.icon}</span> {info.label}
                  </span>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Completed donations: <strong className="text-white">{roleData?.heroStats?.totalDonations || 0}</strong> · Emergency responses: <strong className="text-white">{roleData?.heroStats?.totalEmergencyResponses || 0}</strong>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-400">
                  <BellRing className="h-6 w-6" />
                  <h3 className="font-bold text-white">Emergency Status</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${
                    availabilityStatus === 'available' ? 'bg-emerald-500 animate-ping' :
                    availabilityStatus === 'emergency_only' ? 'bg-amber-500 animate-ping' :
                    'bg-slate-500'
                  }`} />
                  <span className={`text-xs font-bold uppercase ${
                    availabilityStatus === 'available' ? 'text-emerald-400' :
                    availabilityStatus === 'emergency_only' ? 'text-amber-400' :
                    'text-slate-400'
                  }`}>
                    {availabilityStatus === 'emergency_only' ? 'Trauma Only' : availabilityStatus}
                  </span>
                </div>
              </div>

              {/* Status Selector Pills */}
              <div className="mt-4 grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => updateEmergencyStatus('available')}
                  className={`py-2 rounded-lg transition text-center ${
                    availabilityStatus === 'available'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 Ready
                </button>
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => updateEmergencyStatus('emergency_only')}
                  className={`py-2 rounded-lg transition text-center ${
                    availabilityStatus === 'emergency_only'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟡 Trauma
                </button>
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => updateEmergencyStatus('unavailable')}
                  className={`py-2 rounded-lg transition text-center ${
                    availabilityStatus === 'unavailable'
                      ? 'bg-slate-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔴 Pause
                </button>
              </div>

              {statusNotice && (
                <p className="mt-2 text-[11px] text-emerald-400 font-medium">{statusNotice}</p>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
              Locality: <strong className="text-white">{roleData?.homeLocality || 'Manipal / Mangaluru'}</strong> • Radius: <strong className="text-white">{preferredRadius} km</strong>
            </p>
          </div>
        </div>

        {/* Preferences & Radius Control Section */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Preferred Radius Slider */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Compass className="h-5 w-5" />
              <h3 className="font-bold text-white">Preferred Travel Radius</h3>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Only receive emergency broadcasts from hospitals within this distance from your locality.
            </p>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-400">Maximum Distance</span>
                <span className="text-rose-400 font-mono text-base">{preferredRadius} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={preferredRadius}
                onChange={(e) => setPreferredRadius(Number(e.target.value))}
                className="mt-3 w-full accent-rose-600 cursor-pointer"
              />
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>5 km (Local)</span>
                <span>15 km (Default)</span>
                <span>25 km (Regional)</span>
                <span>50 km (District-wide)</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[5, 10, 15, 25, 50].map((r) => (
                <button
                  key={r}
                  onClick={() => setPreferredRadius(r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    preferredRadius === r
                      ? 'bg-rose-600 text-white'
                      : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center gap-2.5 text-sky-400">
              <Sliders className="h-5 w-5" />
              <h3 className="font-bold text-white">Alert & Channel Preferences</h3>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Choose how and when LifePulse coordinates emergency requests with you.
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                <span className="flex items-center gap-2 text-slate-200">
                  <Bell className="h-4 w-4 text-emerald-400" /> Web Push Notifications
                </span>
                <input
                  type="checkbox"
                  checked={notifPrefs.push}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, push: e.target.checked })}
                  className="accent-rose-600"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                <span className="flex items-center gap-2 text-slate-200">
                  <Smartphone className="h-4 w-4 text-sky-400" /> SMS Emergency Alerts
                </span>
                <input
                  type="checkbox"
                  checked={notifPrefs.sms}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, sms: e.target.checked })}
                  className="accent-rose-600"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                <span className="flex items-center gap-2 text-slate-200">
                  <MessageSquare className="h-4 w-4 text-green-400" /> WhatsApp Fallback Broadcasts
                </span>
                <input
                  type="checkbox"
                  checked={notifPrefs.whatsapp}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, whatsapp: e.target.checked })}
                  className="accent-rose-600"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                <span className="flex items-center gap-2 text-slate-200">
                  <Heart className="h-4 w-4 text-rose-500" /> Critical Trauma Only (Code Red)
                </span>
                <input
                  type="checkbox"
                  checked={notifPrefs.criticalOnly}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, criticalOnly: e.target.checked })}
                  className="accent-rose-600"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between">
              {prefNotice && <span className="text-xs text-emerald-400 font-medium">{prefNotice}</span>}
              <button
                onClick={savePreferences}
                disabled={savingPrefs}
                className="ml-auto rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition"
              >
                {savingPrefs ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>

        {/* Public Hero Wall Opt-in */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-amber-400">
              <Award className="h-5 w-5" />
              <h3 className="font-bold text-white text-base">Community Hero Recognition & Shareables</h3>
            </div>
            <p className="mt-1 text-sm text-slate-400 leading-relaxed">
              Celebrate your life-saving donations publicly on the LifePulse Community Wall. Displays only your first name, blood group, and verified district. Contact numbers and home coordinates remain strictly confidential.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                to="/donor/hero-card"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Camera className="h-4 w-4 transition-transform group-hover:rotate-6" />
                <span>📱 Preview & Download My Hero Cards →</span>
              </Link>
              <Link
                to="/hero-wall"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-750 hover:border-slate-600 text-slate-200 hover:text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Visit Community Hero Wall →</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 shadow-inner">
              <div className="text-left md:text-right">
                <span className="block text-xs font-bold text-white">Show My Hero Profile</span>
                <span className="block text-[11px] text-slate-400">
                  {consent ? '🟢 Public on Wall' : '⚪ Hidden from Wall'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={consent}
                onClick={() => setPublicConsent(!consent)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                  consent ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20' : 'bg-slate-700'
                }`}
                title="Toggle public recognition on hero wall"
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    consent ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {consentNotice && (
              <span className="text-xs font-medium text-emerald-400 animate-in fade-in">
                {consentNotice}
              </span>
            )}
          </div>
        </section>
      </main>

      {/* High-Impact Emergency Alert Modal (Human-Centric Copy from reduired.md) */}
      {alerts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-3xl border border-rose-500/50 bg-slate-900 p-7 shadow-2xl shadow-rose-950/60 animate-in fade-in zoom-in-95">
            {/* Header Badge */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white font-bold animate-pulse shadow-lg shadow-rose-600/40">
                🚨
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-400">
                  LIFE PULSE EMERGENCY ALERT
                </p>
                <h2 className="text-xl font-extrabold text-white">Someone near you needs your help.</h2>
              </div>
            </div>

            {alerts.map(({ match, request }) => {
              const seconds = Math.max(0, Math.ceil((Date.parse(match.alertExpiresAt || match.alertedAt) - now) / 1000));
              const etaMinutes = Math.max(3, Math.ceil((match.distance || 5) / 25 * 60));

              return (
                <article key={match.id} className="mt-5 space-y-4">
                  {/* Blood Group & Need Overview */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-rose-500">{request?.bloodGroup}</span>
                        <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 capitalize">
                          {request?.component?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-mono font-bold text-amber-300">
                        <Clock className="h-3.5 w-3.5 animate-spin" />
                        <span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-200">
                        <span>🏥</span>
                        <span className="font-semibold">{request?.hospitalName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <span>📍</span>
                        <span>Approximately <strong>{match.distance} km</strong> from your registered locality</span>
                      </div>
                      <div className="flex items-center gap-2 text-rose-400 text-xs">
                        <span>⏱</span>
                        <span>Urgency: <strong className="capitalize">{request?.urgency || 'Critical emergency'}</strong></span>
                      </div>
                    </div>

                    {/* Motivational Callout & Prominent Travel Time */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80">
                      <p className="text-xs italic text-slate-300">
                        “You could be the person who gets there in time.”
                      </p>
                      <div className="mt-2 flex items-center justify-between rounded-xl bg-rose-950/30 border border-rose-900/40 px-3.5 py-2">
                        <span className="text-xs text-rose-300 font-medium">Estimated travel time:</span>
                        <span className="text-sm font-bold text-rose-200 font-mono">{etaMinutes} minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      disabled={!seconds || !!busyId}
                      onClick={() => respond(match.id, 'accepted')}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 font-bold text-white shadow-xl shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition text-base"
                    >
                      {busyId === match.id ? 'Connecting…' : '[ I CAN HELP ]'}
                    </button>
                    <button
                      disabled={!!busyId}
                      onClick={() => respond(match.id, 'declined')}
                      className="rounded-2xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </article>
              );
            })}

            <p className="mt-4 text-center text-xs text-slate-500">
              Exact location sharing begins only after you accept and grant browser GPS permission.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDashboardPage;
