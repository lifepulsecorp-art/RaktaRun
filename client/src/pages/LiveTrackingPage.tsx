import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Navigation, Car, MapPin, CheckCircle2, LocateFixed, Phone, XCircle, Award, Sparkles, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LiveMap from '../components/LiveMap';
import { AppLayout } from '../components/AppLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const LiveTrackingPage: React.FC = () => {
  const { requestId = '' } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [buddyReferrals, setBuddyReferrals] = useState<any[]>([]);
  const [reportingBuddyId, setReportingBuddyId] = useState('');
  const [buddyReportCategory, setBuddyReportCategory] = useState('certificate_unavailable');
  const [buddyReportNotes, setBuddyReportNotes] = useState('');
  const [buddyNotice, setBuddyNotice] = useState('');
  const [myMatch, setMyMatch] = useState<any>(null);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastGpsUpdate, setLastGpsUpdate] = useState<string>('');
  const [celebrationModal, setCelebrationModal] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const watchId = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      if (role === 'donor') {
        const { data } = await api.get(`/donors/me/matches/${requestId}`);
        setRequest(data.request);
        setMyMatch(data.match);
        if (data.match?.status === 'donated' && !celebrated) {
          setCelebrationModal(true);
        }
      } else {
        const { data } = await api.get(`/requests/${requestId}`);
        setRequest(data.request);
        const { data: found } = await api.get(`/hospitals/${data.request.hospitalId}/requests/${requestId}/matches`);
        setMatches(found);
        try {
          const { data: buddyData } = await api.get(`/hospitals/${data.request.hospitalId}/requests/${requestId}/buddy-referrals`);
          setBuddyReferrals(buddyData);
        } catch {
          setBuddyReferrals([]);
        }
      }
      setError('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Tracking information is unavailable.');
    }
  }, [requestId, role, celebrated]);

  useEffect(() => {
    refresh();
    const intervalMs = role === 'donor' ? 4000 : 2500;
    const timer = setInterval(refresh, intervalMs);
    return () => {
      clearInterval(timer);
      if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
    };
  }, [refresh, role]);

  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setNotice('Device does not support GPS location sharing.');
      return;
    }
    if (!myMatch || !['accepted', 'en_route'].includes(myMatch.status)) {
      setNotice('Location sharing is active only during an accepted emergency response.');
      return;
    }
    setNotice('Requesting device location permission (High-Accuracy GPS)…');
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    watchId.current = navigator.geolocation.watchPosition(
      async ({ coords }) => {
        try {
          setAccuracy(coords.accuracy);
          setLastGpsUpdate(new Date().toLocaleTimeString());
          const { data } = await api.post(`/donors/matches/${myMatch.id}/location`, {
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          setMyMatch(data.match);
          setNotice(data.message || 'GPS location transmitting to hospital.');
          setSharing(data.trackingActive);
          if (!data.trackingActive && watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
          }
        } catch (e: any) {
          setNotice(e.response?.data?.error || 'Location transmission failed.');
          setSharing(false);
          if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
          }
        }
      },
      (e) => {
        if (e.code === 1) {
          setNotice('Device GPS access denied. Please click "Allow" in your browser location prompt so the hospital can track your ETA.');
        } else if (e.code === 2) {
          setNotice('Device location unavailable. Please ensure GPS/Location service is turned ON in your device settings.');
        } else {
          setNotice(`GPS notice: ${e.message}`);
        }
        setSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    setSharing(true);
  }, [myMatch]);

  // Auto-prompt device GPS permission on mount when match is accepted
  useEffect(() => {
    if (
      role === 'donor' &&
      myMatch &&
      ['accepted', 'en_route'].includes(myMatch.status) &&
      !sharing &&
      watchId.current === null
    ) {
      startSharing();
    }
  }, [role, myMatch, sharing, startSharing]);

  const completeDonation = async (matchId: string) => {
    if (!request?.hospitalId) return;
    try {
      await api.post(`/hospitals/${request.hospitalId}/requests/${requestId}/matches/${matchId}/complete`);
      await refresh();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not complete donation.');
    }
  };

  const cancelRequest = async () => {
    if (!request?.hospitalId) return;
    if (!window.confirm('Are you sure you want to cancel this emergency request?')) return;
    try {
      await api.post(`/hospitals/${request.hospitalId}/requests/${requestId}/cancel`);
      await refresh();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not cancel request.');
    }
  };

  const markUnfulfilled = async () => {
    if (!request?.hospitalId) return;
    const reason = window.prompt('Reason for closing request as unfulfilled:', 'Donor response window expired; alternative blood bank protocol initiated');
    if (!reason) return;
    try {
      await api.post(`/hospitals/${request.hospitalId}/requests/${requestId}/unfulfilled`, { reason });
      await refresh();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not mark request as unfulfilled.');
    }
  };

  const handleConsentChoice = async (enable: boolean) => {
    try {
      await api.put('/donors/me/public-hero-consent', { enabled: enable });
      setCelebrated(true);
      setCelebrationModal(false);
      if (enable) navigate('/hero-wall');
    } catch (e: any) {
      setCelebrationModal(false);
    }
  };

  const reportBuddyReferral = async (referralId: string) => {
    if (!request?.hospitalId) return;
    setBuddyNotice('');
    try {
      const { data } = await api.post(`/hospitals/${request.hospitalId}/buddy-referrals/${referralId}/report`, {
        category: buddyReportCategory,
        notes: buddyReportNotes,
      });
      setBuddyReferrals((current) => current.map((lead) => lead.id === referralId ? data.referral : lead));
      setReportingBuddyId('');
      setBuddyReportNotes('');
      setBuddyNotice('Report sent to LifePulse administrators for review.');
    } catch (err: any) {
      setBuddyNotice(err.response?.data?.error || 'Could not submit the report.');
    }
  };

  const donorLocation = myMatch?.donorCurrentLocation;
  const mapPoints = matches.filter((m: any) => m.donorCurrentLocation).map((m: any) => ({ id: m.id, name: m.donor?.fullName || 'Donor', position: m.donorCurrentLocation }));

  return (
    <AppLayout
      title="Live Emergency Dispatch & Transit"
      subtitle={`Real-time GPS coordination • Request #${requestId}`}
      badge={
        <Badge variant={request?.status === 'fulfilled' ? 'success' : request?.status === 'cancelled' ? 'outline' : 'destructive'} className="uppercase">
          {request?.status || 'LOADING'}
        </Badge>
      }
      withSidebar={true}
    >
      <div className="space-y-6">
        {error && (
          <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-800 dark:text-rose-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {request && (
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">{request.hospitalName}</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                  {request.bloodGroup} · {request.unitsRequired} units {request.component?.replace('_', ' ')}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <Badge variant="destructive" className="capitalize text-xs">
                    {request.urgency} priority
                  </Badge>
                  <span>•</span>
                  <span>{request.radiusKm} km active search radius</span>
                  {request.contactPerson && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Phone className="h-3.5 w-3.5" /> {request.contactPerson.name} ({request.contactPerson.phone})
                      </span>
                    </>
                  )}
                </div>
              </div>

              {role !== 'donor' && ['searching', 'matched'].includes(request.status) && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markUnfulfilled}
                    className="border-amber-300 dark:border-amber-900/80 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Mark Unfulfilled
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={cancelRequest}
                  >
                    Cancel Request
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {role === 'donor' ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                    <Navigation className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Your Live Route to Hospital</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Real-time road transit to {request?.hospitalName}
                    </p>
                  </div>
                </div>
                {sharing && (
                  <Badge variant="success" className="gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    GPS Streaming Active
                  </Badge>
                )}
              </div>

              {/* Turn-by-Turn Mobile Google Maps Navigation Link */}
              {request?.hospitalLocation && ['accepted', 'en_route'].includes(myMatch?.status) && (
                <div className="mt-5 rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      <Navigation className="h-4 w-4" /> Turn-by-Turn Mobile Navigation
                    </span>
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      Direct Google Maps App
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${request.hospitalLocation.latitude},${request.hospitalLocation.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 py-3.5 px-4 text-sm font-bold text-white shadow-xl shadow-emerald-900/20 hover:from-emerald-500 hover:to-teal-500 transition-all hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Open Turn-by-Turn Navigation in Google Maps App ↗</span>
                  </a>
                  <p className="mt-2 text-center text-[11px] text-slate-600 dark:text-slate-400">
                    Launches Google Maps with live voice-guided driving directions directly to <strong>{request.hospitalName}</strong>
                  </p>
                </div>
              )}

              {/* Live Interactive Road Map */}
              {request?.hospitalLocation && (
                <div className="mt-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <LiveMap
                    hospital={request.hospitalLocation}
                    donors={donorLocation ? [{ id: myMatch?.id || 'you', name: 'You', position: donorLocation }] : []}
                  />
                </div>
              )}

              {/* Device GPS Permission & Realtime Streaming Status Card */}
              <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${sharing ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {sharing ? 'Exact Device GPS Stream Active' : 'Device GPS Inactive'}
                    </span>
                  </div>
                  {accuracy != null && sharing && (
                    <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                      ±{Math.round(accuracy)}m device accuracy
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {sharing
                    ? `Your phone's exact coordinates are transmitting live to ${request?.hospitalName} trauma unit. Ephemeral tracking automatically ceases when you arrive within 150m.`
                    : 'LifePulse requires browser device location permission to guide your transit and provide real-time ETA to the hospital.'}
                </p>

                {notice && (
                  <p className="mt-3 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-lg p-2.5">
                    {notice}
                  </p>
                )}

                {donorLocation && (
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-900 pt-3">
                    <span>GPS: <strong>{donorLocation.latitude.toFixed(5)}, {donorLocation.longitude.toFixed(5)}</strong></span>
                    {lastGpsUpdate && <span>Updated: <strong>{lastGpsUpdate}</strong></span>}
                  </div>
                )}

                {!sharing && ['accepted', 'en_route'].includes(myMatch?.status) && (
                  <Button
                    type="button"
                    onClick={startSharing}
                    className="mt-4 gap-2 text-xs font-bold"
                  >
                    <LocateFixed className="h-4 w-4" /> Grant / Restart Exact GPS Access
                  </Button>
                )}
              </div>

              {myMatch?.status === 'reached' && (
                <div className="mt-5 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-4 rounded-xl text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Hospital destination reached. Ephemeral location sharing has stopped.</span>
                </div>
              )}

              {myMatch?.status === 'donated' && (
                <div className="mt-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 text-emerald-900 dark:text-emerald-300">
                  <p className="font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" /> Donation Recorded by Hospital!
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Thank you for answering this emergency dispatch. You have saved a life.
                  </p>
                  <button
                    onClick={() => setCelebrationModal(true)}
                    className="mt-3 flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Celebrate on Hero Wall
                  </button>
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Emergency Dispatch Status</h3>
                <p className="mt-1 text-sm font-semibold capitalize text-emerald-600 dark:text-emerald-400">{myMatch?.status || 'Loading your match'}</p>
              </div>

              {myMatch?.distanceRemaining != null && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Distance to Hospital</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{(myMatch.distanceRemaining / 1000).toFixed(1)} km</p>
                </div>
              )}

              {myMatch?.etaSeconds != null && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Estimated Travel Time</span>
                  <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{Math.ceil(myMatch.etaSeconds / 60)} min</p>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">Destination Facility:</span>
                <p className="text-slate-900 dark:text-white font-medium">{request?.hospitalName}</p>
                {request?.hospitalLocation && (
                  <p className="text-[11px] font-mono text-slate-500 mt-1">
                    {request.hospitalLocation.latitude.toFixed(4)}, {request.hospitalLocation.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Car className="h-5 w-5 text-rose-600 dark:text-rose-400" /> Donors in Transit (Real-Time GPS)
                </h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Sync: 2.5s</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Hospital emergency station monitoring live positions of traveling responders.
              </p>

              {request?.hospitalLocation && (
                <div className="mt-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <LiveMap hospital={request.hospitalLocation} donors={mapPoints} />
                </div>
              )}

              <div className="mt-5 space-y-4">
                {matches.filter((m) => ['accepted', 'en_route', 'reached', 'donated'].includes(m.status)).map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <b className="text-slate-900 dark:text-white">{m.donor?.fullName || 'Verified donor'}</b>
                        <span className="ml-2 rounded bg-rose-50 dark:bg-rose-500/20 px-2 py-0.5 text-xs text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-500/30">
                          {m.donor?.bloodGroup}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.donorCurrentLocation ? (
                          <Badge variant="success" className="gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                            Live GPS Streaming
                          </Badge>
                        ) : (
                          <Badge variant="warning">
                            Awaiting device GPS
                          </Badge>
                        )}
                        <Badge variant="secondary" className="uppercase font-bold">{m.status}</Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      Match score {m.score} · {m.distance} km initial
                      {m.distanceRemaining != null ? ` · ${(m.distanceRemaining / 1000).toFixed(1)} km remaining` : ''}
                      {m.etaSeconds != null ? ` · ${Math.ceil(m.etaSeconds / 60)} min ETA` : ''}
                    </p>
                    {m.donorCurrentLocation && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" /> GPS: {m.donorCurrentLocation.latitude.toFixed(5)}, {m.donorCurrentLocation.longitude.toFixed(5)}
                      </p>
                    )}
                    {['accepted', 'en_route', 'reached'].includes(m.status) && (
                      <Button
                        size="sm"
                        onClick={() => completeDonation(m.id)}
                        className="mt-3 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Confirm donation complete
                      </Button>
                    )}
                  </div>
                ))}
                {matches.filter((m) => ['accepted', 'en_route', 'reached', 'donated'].includes(m.status)).length === 0 && (
                  <p className="text-sm text-slate-500 py-4 text-center">Waiting for donor responses. Next escalation batch runs every 30 seconds.</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Identified Donors ({matches.length})
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Ranked</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Filtered automatically based on recipient blood compatibility, medical clearance, and response radius.
              </p>

              <div className="mt-4 space-y-3">
                {matches.filter((m) => ['alerted', 'expired', 'declined'].includes(m.status)).map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">#{m.rank || 1}</span>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">{m.donor?.fullName || 'Verified Donor'}</span>
                          <span className="rounded bg-rose-50 dark:bg-rose-500/20 px-2 py-0.5 text-xs text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-500/30">
                            {m.donor?.bloodGroup}
                          </span>
                        </div>
                        <p className="mt-1 flex items-start gap-1 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{m.donor?.homeLocality || 'Verified Area'} · <strong>{m.distance} km</strong> away</span>
                        </p>
                      </div>
                      <Badge variant={m.status === 'alerted' ? 'warning' : m.status === 'declined' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {m.status === 'alerted' ? 'Awaiting' : m.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                      <span>Match Score: <strong className="text-slate-700 dark:text-slate-300">{m.score}</strong></span>
                      <span>Screening: <strong className="text-emerald-600 dark:text-emerald-400">Verified Certificate</strong></span>
                    </div>
                  </div>
                ))}
                {matches.length === 0 && <p className="text-sm text-slate-500 py-4 text-center">No compatible donors found in current radius.</p>}
              </div>

              <section className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">Buddy invite responses</h3>
                  <Badge variant="secondary">{buddyReferrals.length}</Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">These people shared an interest through a donor invite. They are not yet cleared or confirmed as donors.</p>
                {buddyNotice && <p role="status" className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{buddyNotice}</p>}
                <div className="mt-3 space-y-3">
                  {buddyReferrals.map((lead) => (
                    <div key={lead.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{lead.friendName}</p>
                          <a className="text-xs text-emerald-800 underline dark:text-emerald-300" href={`tel:${lead.friendPhone}`}>{lead.friendPhone}</a>
                        </div>
                        {lead.hospitalReport ? (
                          <Badge variant="warning">Sent for admin review</Badge>
                        ) : (
                          <button type="button" onClick={() => { setReportingBuddyId(reportingBuddyId === lead.id ? '' : lead.id); setBuddyNotice(''); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            Report concern
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Interest received {new Date(lead.createdAt).toLocaleString()}</p>
                      {reportingBuddyId === lead.id && !lead.hospitalReport && (
                        <div className="mt-3 space-y-2 border-t border-amber-200 pt-3 dark:border-amber-900">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Operational concern
                            <select value={buddyReportCategory} onChange={(event) => setBuddyReportCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                              <option value="certificate_unavailable">Certificate unavailable</option>
                              <option value="identity_not_verified">Identity could not be verified</option>
                              <option value="not_available">Person was not available</option>
                              <option value="screening_concern">Screening concern; follow hospital protocol</option>
                              <option value="other">Other operational concern</option>
                            </select>
                          </label>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Note (optional; do not include a diagnosis or private medical details)
                            <textarea maxLength={240} rows={2} value={buddyReportNotes} onChange={(event) => setBuddyReportNotes(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                          </label>
                          <Button size="sm" onClick={() => reportBuddyReferral(lead.id)}>Send report for admin review</Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {buddyReferrals.length === 0 && <p className="py-3 text-center text-xs text-slate-500">No buddy invite responses for this request yet.</p>}
                </div>
              </section>
            </Card>
          </div>
        )}
      </div>

      {/* Post-Donation Celebration Prompt Modal */}
      {celebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-slate-900 p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-3xl text-amber-500 border border-amber-200 dark:border-amber-500/20">
              <Award className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">You helped save a life!</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              The hospital has confirmed your successful blood donation.
            </p>
            <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-left text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-200">“Would you like us to celebrate your contribution publicly?”</p>
              <p>Choosing yes will feature your first name, blood group, and district on the public LifePulse Hero Wall with a custom share card.</p>
            </div>
            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                onClick={() => handleConsentChoice(true)}
                className="w-full py-3 font-semibold shadow-lg shadow-rose-600/30"
              >
                YES, CELEBRATE PUBLICLY →
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleConsentChoice(false)}
                className="w-full text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                KEEP PRIVATE
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default LiveTrackingPage;
