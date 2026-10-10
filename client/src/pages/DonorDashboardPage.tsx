import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  ShieldCheck,
  Heart,
  LogOut,
  BellRing,
  UserCheck,
  Sliders,
  MessageSquare,
  Smartphone,
  Bell,
  Clock,
  Compass,
  Camera,
  Sparkles,
  History,
  Calendar,
  X,
  MapPin,
  Navigation,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const BADGE_MAP: Record<string, { label: string; icon: string }> = {
  life_pulse_hero: { label: 'LifePulse Hero', icon: '🦸' },
  rapid_responder: { label: 'Rapid Responder', icon: '⚡' },
  repeat_hero: { label: 'Repeat Hero', icon: '❤️' },
  rare_blood_hero: { label: 'Rare Blood Hero', icon: '🏅' },
  community_champion: { label: 'Community Champion', icon: '🌟' },
};

export function getCompatibilityExplanation(donorBlood?: string, reqBlood?: string): string {
  if (!donorBlood || !reqBlood) return 'Clinically verified compatible donor match';
  if (donorBlood === 'O-') return `🌟 Universal Life-Saver: Your O- is a universal emergency match for this ${reqBlood} patient.`;
  if (donorBlood === reqBlood) return `🎯 Exact Group Match: Your verified ${donorBlood} directly matches this patient's blood group.`;
  return `✅ Compatible Blood Match: Your ${donorBlood} is clinically compatible with recipient ${reqBlood}.`;
}

export const DonorDashboardPage: React.FC = () => {
  const { profile, roleData, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [allAlerts, setAllAlerts] = useState<any[]>([]);
  const [dismissedModalIds, setDismissedModalIds] = useState<Set<string>>(new Set());
  const [shareLocationEnabled, setShareLocationEnabled] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [now, setNow] = useState(Date.now());
  const [consent, setConsent] = useState(Boolean(roleData?.publicHeroConsent));
  const [consentNotice, setConsentNotice] = useState('');

  // History states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<{ summary?: any; history: any[] }>({ history: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'donations' | 'alerts'>('all');

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/donors/me/history');
      setHistoryData(res.data);
    } catch (e) {
      console.error('Failed to load donor history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal) {
      fetchHistory();
    }
  }, [showHistoryModal]);
  
  // Donor preference states
  const [preferredRadius, setPreferredRadius] = useState<number>(roleData?.preferredRadius || 15);
  const [savingRadius, setSavingRadius] = useState(false);
  const [radiusNotice, setRadiusNotice] = useState('');

  const [notifPrefs, setNotifPrefs] = useState({
    push: roleData?.notificationPreferences?.push ?? true,
    sms: roleData?.notificationPreferences?.sms ?? true,
    whatsapp: roleData?.notificationPreferences?.whatsapp ?? true,
    criticalOnly: roleData?.notificationPreferences?.criticalOnly ?? false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefNotice, setPrefNotice] = useState('');

  // Sync preferred radius and notification preferences whenever roleData updates
  useEffect(() => {
    if (roleData?.preferredRadius != null) {
      setPreferredRadius(Number(roleData.preferredRadius));
    }
    if (roleData?.notificationPreferences) {
      setNotifPrefs({
        push: roleData.notificationPreferences.push ?? true,
        sms: roleData.notificationPreferences.sms ?? true,
        whatsapp: roleData.notificationPreferences.whatsapp ?? true,
        criticalOnly: roleData.notificationPreferences.criticalOnly ?? false,
      });
    }
  }, [roleData?.preferredRadius, roleData?.notificationPreferences]);

  const handleUpdateRadius = async (newRadius: number) => {
    const validRadius = Math.max(5, Math.min(50, Number(newRadius) || 15));
    setPreferredRadius(validRadius);
    setSavingRadius(true);
    setRadiusNotice('');
    try {
      await api.put('/donors/me/preferences', {
        preferredRadius: validRadius,
        notificationPreferences: notifPrefs,
      });
      await refreshProfile();
      setRadiusNotice(`✓ Travel radius saved (${validRadius} km)`);
      setTimeout(() => setRadiusNotice(''), 3500);
    } catch {
      setRadiusNotice('Failed to save radius.');
      setTimeout(() => setRadiusNotice(''), 3500);
    } finally {
      setSavingRadius(false);
    }
  };

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
      setAllAlerts(Array.isArray(data) ? data : []);
    } catch {
      /* Keep last alert snapshot while reconnecting */
    }
  }, []);

  useEffect(() => {
    refreshAlerts();
    const poll = setInterval(refreshAlerts, 4000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [refreshAlerts]);

  const pendingAlerts = allAlerts.filter(
    (entry: any) =>
      entry.match?.status === 'alerted' &&
      Date.parse(entry.match.alertExpiresAt || entry.match.alertedAt || '') > now
  );

  const activeMissions = allAlerts.filter(
    (entry: any) => ['accepted', 'en_route', 'reached'].includes(entry.match?.status)
  );

  const respond = async (matchId: string, response: 'accepted' | 'declined', shareLocation: boolean = true) => {
    setBusyId(matchId);
    try {
      let initialCoords: { latitude: number; longitude: number } | null = null;
      if (response === 'accepted' && shareLocation && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 6000,
              maximumAge: 0,
            });
          });
          initialCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        } catch (geoErr) {
          console.warn('Initial GPS query skipped or denied on accept:', geoErr);
        }
      }

      await api.post(`/donors/matches/${matchId}/respond`, { response });

      if (response === 'accepted' && initialCoords) {
        try {
          await api.post(`/donors/matches/${matchId}/location`, initialCoords);
        } catch (locErr) {
          console.warn('Initial live location post deferred:', locErr);
        }
      }

      if (response === 'accepted') {
        const targetReq = allAlerts.find((item) => item.match.id === matchId)?.request;
        navigate(`/live-tracking/${targetReq?.id || ''}`);
      } else {
        await refreshAlerts();
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
      await refreshProfile();
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
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{roleData?.fullName || profile?.name || 'Verified Donor'}</p>
              <span className="inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                Blood Group: {roleData?.bloodGroup || '—'} Verified
              </span>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Emergency Readiness & Hero Status</h2>
            <p className="text-sm text-slate-400">
              Active volunteer responder across the Udupi & Dakshina Kannada trauma emergency network.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Network Status: <strong>Live Connected</strong></span>
          </div>
        </div>

        {/* Active Donation Missions (En Route / In Transit) */}
        {activeMissions.length > 0 && (
          <div className="mt-6 space-y-4">
            {activeMissions.map(({ match, request }: any) => (
              <div
                key={match.id}
                className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-emerald-950/30 animate-in fade-in"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                      <Navigation className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                          Active Donation Mission
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          Live GPS Streaming Active
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        En Route to {request?.hospitalName || 'Hospital'}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-300">
                        Patient requires <strong>{request?.bloodGroup} {request?.component?.replace('_', ' ')}</strong> · Mission Status: <strong className="capitalize text-emerald-300">{match.status.replace('_', ' ')}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/live-tracking/${request?.id}`}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-950/60 hover:from-emerald-500 hover:to-teal-500 transition active:scale-[0.98]"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Open Live GPS Navigation & Route →</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Incoming Emergency Requests Banner on Dashboard */}
        {pendingAlerts.length > 0 && (
          <div className="mt-6 space-y-4">
            {pendingAlerts.map(({ match, request }: any) => {
              const seconds = Math.max(0, Math.ceil((Date.parse(match.alertExpiresAt || match.alertedAt) - now) / 1000));
              const etaMinutes = Math.max(3, Math.ceil((match.distance || 5) / 25 * 60));
              const compText = getCompatibilityExplanation(roleData?.bloodGroup, request?.bloodGroup);

              return (
                <div
                  key={match.id}
                  className="rounded-3xl border-2 border-rose-500/60 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-rose-950/50 animate-in fade-in"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-1 text-xs font-black text-rose-300 uppercase tracking-widest">
                          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                          Emergency Hospital Dispatch
                        </span>
                        <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-mono font-bold text-amber-300">
                          <Clock className="h-3.5 w-3.5 animate-spin" />
                          <span>Expires in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-white">
                          {request?.hospitalName} urgently requires {request?.bloodGroup} {request?.component?.replace('_', ' ')}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-emerald-400">
                          {compText}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          📍 Located approx. <strong>{match.distance} km</strong> away (Est. drive time: <strong className="text-rose-300">{etaMinutes} mins</strong>) · Urgency: <strong className="capitalize text-rose-400">{request?.urgency || 'Critical'}</strong>
                        </p>
                      </div>

                      {/* Location Sharing Checkbox */}
                      <label className="inline-flex items-center gap-2.5 text-xs text-slate-300 bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 cursor-pointer hover:border-slate-700 transition">
                        <input
                          type="checkbox"
                          checked={shareLocationEnabled}
                          onChange={(e) => setShareLocationEnabled(e.target.checked)}
                          className="accent-emerald-500 h-4 w-4 rounded"
                        />
                        <span className="flex items-center gap-1.5">
                          <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                          <strong>Share real-time GPS location</strong> with hospital team upon acceptance
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                      <button
                        disabled={!seconds || !!busyId}
                        onClick={() => respond(match.id, 'accepted', shareLocationEnabled)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-950/50 hover:from-emerald-500 hover:to-teal-500 transition active:scale-[0.98] disabled:opacity-50"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>
                          {busyId === match.id
                            ? 'Connecting…'
                            : shareLocationEnabled
                            ? 'Accept Donation & Share Location'
                            : 'Accept Donation'}
                        </span>
                      </button>
                      <button
                        disabled={!!busyId}
                        onClick={() => respond(match.id, 'declined')}
                        className="w-full sm:w-auto rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-3.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3 Status Cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-rose-400">
                <ShieldCheck className="h-6 w-6" />
                <h3 className="font-bold text-white">Hospital Certificate</h3>
              </div>
              <p className="mt-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">Certificate ID</p>
              <p className="font-mono text-sm font-bold text-white">{roleData?.verification?.certificateId || 'Awaiting verification'}</p>
              <p className="mt-3 text-xs text-slate-400">Verified by: <strong className="text-white">{roleData?.verification?.hospitalName || '—'}</strong></p>
              <p className="text-xs text-slate-500 mt-1">Medical Officer: {roleData?.verification?.verifiedBy || '—'}</p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80">
              <Link
                to="/donor/register"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Update Screening Certificate →</span>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl flex flex-col justify-between">
            <div>
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
            <div className="mt-5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-300 hover:text-white transition shadow-sm active:scale-[0.98]"
              >
                <History className="h-3.5 w-3.5 text-rose-400" />
                <span>View Donation History ({roleData?.heroStats?.totalDonations || 0}) →</span>
              </button>
            </div>
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-rose-400">
                <Compass className="h-5 w-5" />
                <h3 className="font-bold text-white">Preferred Travel Radius</h3>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Only receive emergency broadcasts from hospitals within this distance from your locality.
              </p>

              {/* Default Registered Location Display */}
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-400" /> Default Registered Location
                  </span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Verified Base Station
                  </span>
                </div>
                <p className="text-sm font-bold text-white pt-1">
                  {roleData?.homeLocality || 'Manipal (671326)'}
                </p>
                {roleData?.coordinates && (
                  <p className="text-[11px] font-mono text-slate-400">
                    Base Coordinates: {roleData.coordinates.latitude?.toFixed(4)}° N, {roleData.coordinates.longitude?.toFixed(4)}° E
                  </p>
                )}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-400">Maximum Distance</span>
                  <span className="text-rose-400 font-mono text-base font-bold">{preferredRadius} km</span>
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
                    onClick={() => handleUpdateRadius(r)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      preferredRadius === r
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/80">
              {radiusNotice ? (
                <span className="text-xs text-emerald-400 font-medium animate-in fade-in">{radiusNotice}</span>
              ) : (
                <span className="text-xs text-slate-400">Auto-filters hospital alerts within {preferredRadius} km</span>
              )}
              <button
                type="button"
                onClick={() => handleUpdateRadius(preferredRadius)}
                disabled={savingRadius}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-950/40 transition disabled:opacity-50 active:scale-[0.98]"
              >
                {savingRadius ? 'Saving…' : 'Save Travel Radius'}
              </button>
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

      {/* High-Impact Emergency Alert Modal */}
      {pendingAlerts.filter((item) => !dismissedModalIds.has(item.match.id)).length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div role="dialog" aria-modal="true" className="relative w-full max-w-lg rounded-3xl border border-rose-500/50 bg-slate-900 p-7 shadow-2xl shadow-rose-950/60 animate-in fade-in zoom-in-95">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white font-bold animate-pulse shadow-lg shadow-rose-600/40">
                  🚨
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-rose-400">
                    LIFE PULSE EMERGENCY ALERT
                  </p>
                  <h2 className="text-xl font-extrabold text-white">Someone near you needs your blood.</h2>
                </div>
              </div>

              {/* Minimize/Dismiss Button to review dashboard */}
              <button
                onClick={() => {
                  const ids = new Set(dismissedModalIds);
                  pendingAlerts.forEach((a) => ids.add(a.match.id));
                  setDismissedModalIds(ids);
                }}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Minimize alert to dashboard"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {pendingAlerts.filter((item) => !dismissedModalIds.has(item.match.id)).map(({ match, request }) => {
              const seconds = Math.max(0, Math.ceil((Date.parse(match.alertExpiresAt || match.alertedAt) - now) / 1000));
              const etaMinutes = Math.max(3, Math.ceil((match.distance || 5) / 25 * 60));
              const compText = getCompatibilityExplanation(roleData?.bloodGroup, request?.bloodGroup);

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
                        <span className="text-xs text-slate-400">({request?.unitsRequired || 1} units)</span>
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
                      <div className="rounded-xl bg-slate-900 border border-slate-800/80 p-2.5 text-xs text-emerald-400 font-medium">
                        {compText}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <span>📍</span>
                        <span>Approximately <strong>{match.distance} km</strong> away (within your preferred {preferredRadius} km radius)</span>
                      </div>
                      <div className="flex items-center gap-2 text-rose-400 text-xs">
                        <span>⏱</span>
                        <span>Urgency: <strong className="capitalize">{request?.urgency || 'Critical emergency'}</strong></span>
                      </div>
                    </div>

                    {/* Motivational Callout & Prominent Travel Time */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80">
                      <p className="text-xs italic text-slate-300">
                        “You could be the person who gets there in time.”
                      </p>
                      <div className="mt-2 flex items-center justify-between rounded-xl bg-rose-950/30 border border-rose-900/40 px-3.5 py-2">
                        <span className="text-xs text-rose-300 font-medium">Estimated travel time:</span>
                        <span className="text-sm font-bold text-rose-200 font-mono">{etaMinutes} minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Location Sharing Option */}
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={shareLocationEnabled}
                      onChange={(e) => setShareLocationEnabled(e.target.checked)}
                      className="accent-emerald-500 h-4 w-4 rounded cursor-pointer"
                    />
                    <div>
                      <span className="block font-bold text-white flex items-center gap-1.5">
                        <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                        Share Live GPS Location with Hospital
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        Allows hospital trauma staff to monitor your driving transit and prepare emergency triage beds.
                      </span>
                    </div>
                  </label>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      disabled={!seconds || !!busyId}
                      onClick={() => respond(match.id, 'accepted', shareLocationEnabled)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 font-bold text-white shadow-xl shadow-emerald-950/50 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition text-sm sm:text-base active:scale-[0.98]"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>
                        {busyId === match.id
                          ? 'Connecting…'
                          : shareLocationEnabled
                          ? 'Accept Donation & Share Location'
                          : 'Accept Donation'}
                      </span>
                    </button>
                    <button
                      disabled={!!busyId}
                      onClick={() => respond(match.id, 'declined')}
                      className="rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-3.5 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition text-xs sm:text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </article>
              );
            })}

            <p className="mt-4 text-center text-xs text-slate-500">
              Live location streaming is protected and only active during this emergency transit.
            </p>
          </div>
        </div>
      )}

      {/* Donor Contribution & History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
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
                  Verified Contribution Log
                </span>
                <h2 className="text-xl font-bold text-white">Donation & Emergency Response History</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete record of your hospital screenings, emergency alert dispatches, and life-saving donations.
                </p>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center gap-2 text-rose-400 mb-1">
                  <Heart className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Donations</span>
                </div>
                <p className="text-2xl font-black text-white">{historyData.summary?.totalDonations ?? roleData?.heroStats?.totalDonations ?? 0}</p>
                <p className="text-[11px] text-emerald-400 font-medium mt-1">Verified hospital transfusions</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center gap-2 text-rose-400 mb-1">
                  <BellRing className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dispatches Answered</span>
                </div>
                <p className="text-2xl font-black text-white">{historyData.summary?.totalEmergencyResponses ?? roleData?.heroStats?.totalEmergencyResponses ?? 0}</p>
                <p className="text-[11px] text-amber-300 font-medium mt-1">Coastal Karnataka trauma alerts</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center gap-2 text-sky-400 mb-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Screening Center</span>
                </div>
                <p className="text-sm font-bold text-white truncate">{historyData.summary?.hospitalName || roleData?.verification?.hospitalName || 'Kasturba Hospital, Manipal'}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">{historyData.summary?.certificateId || roleData?.verification?.certificateId || 'Screened Network'}</p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="mt-6 flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`rounded-lg px-3 py-1.5 transition ${historyFilter === 'all' ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'}`}
                >
                  All Entries ({historyData.history.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('donations')}
                  className={`rounded-lg px-3 py-1.5 transition ${historyFilter === 'donations' ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'}`}
                >
                  Completed Donations ({historyData.history.filter((h: any) => h.matchStatus === 'donated').length})
                </button>
                <button
                  onClick={() => setHistoryFilter('alerts')}
                  className={`rounded-lg px-3 py-1.5 transition ${historyFilter === 'alerts' ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'}`}
                >
                  Emergency Responses ({historyData.history.filter((h: any) => h.response === 'accepted' || h.type?.includes('Emergency')).length})
                </button>
              </div>

              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                Blood Group: {roleData?.bloodGroup}
              </span>
            </div>

            {/* History List */}
            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
              {loadingHistory && (
                <div className="py-8 text-center text-xs text-slate-400">Loading verified contribution history…</div>
              )}

              {!loadingHistory && historyData.history.length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-xs text-slate-400">
                  No previous donations or responses logged yet. When you answer hospital alerts and donate, your verified history will be displayed here.
                </div>
              )}

              {!loadingHistory && historyData.history
                .filter((item: any) => {
                  if (historyFilter === 'donations') return item.matchStatus === 'donated';
                  if (historyFilter === 'alerts') return item.response === 'accepted' || item.type?.includes('Emergency');
                  return true;
                })
                .map((item: any, idx: number) => {
                  const dateStr = item.donationCompletedAt || item.alertedAt;
                  const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified Date';

                  return (
                    <article
                      key={item.id || idx}
                      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-700 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
                            item.matchStatus === 'donated' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          }`}>
                            {item.matchStatus === 'donated' ? '🩸' : '🚨'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{item.hospitalName}</h4>
                              <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                                {item.bloodGroup} · {item.component?.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400 flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-slate-500" />
                              <span>{dateFormatted}</span>
                              <span className="text-slate-600">·</span>
                              <span>{item.type || 'Verified Blood Donation'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800/80">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            item.matchStatus === 'donated' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}>
                            {item.matchStatus === 'donated' ? '✓ Donation Fulfilled' : 'Alert Answered'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Verified by: {item.verifiedBy || 'Dr. Medical Officer'}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                LifePulse Emergency Health Network • Coastal Karnataka
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

export default DonorDashboardPage;
