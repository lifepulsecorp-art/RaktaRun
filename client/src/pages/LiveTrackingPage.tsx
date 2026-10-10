import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Navigation, ArrowLeft, Shield, Car, MapPin, CheckCircle2, LocateFixed, Phone, XCircle, Award, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LiveMap from '../components/LiveMap';

export const LiveTrackingPage: React.FC = () => {
  const { requestId = '' } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
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

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (role === 'donor') {
      navigate('/donor');
    } else if (role === 'hospital') {
      navigate('/hospital');
    } else if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const donorLocation = myMatch?.donorCurrentLocation;
  const mapPoints = matches.filter((m: any) => m.donorCurrentLocation).map((m: any) => ({ id: m.id, name: m.donor?.fullName || 'Donor', position: m.donorCurrentLocation }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white transition" title="Go back">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-bold text-white">Live Emergency Dispatch & Transit</h1>
              <span className="text-xs text-rose-400">Request #{requestId}</span>
            </div>
          </div>
          <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400 uppercase">
            {request?.status || 'LOADING'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && <p role="alert" className="mb-5 rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</p>}

        {request && (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">{request.hospitalName}</p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {request.bloodGroup} · {request.unitsRequired} units {request.component?.replace('_', ' ')}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="capitalize text-rose-400 font-semibold">{request.urgency} priority</span>
                  <span>•</span>
                  <span>{request.radiusKm} km active search radius</span>
                  {request.contactPerson && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <Phone className="h-3 w-3" /> Contact: {request.contactPerson.name} ({request.contactPerson.phone})
                      </span>
                    </>
                  )}
                </div>
              </div>

              {role !== 'donor' && ['searching', 'matched'].includes(request.status) && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={markUnfulfilled}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-900/80 bg-amber-950/40 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-900/60 transition"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Mark Unfulfilled
                  </button>
                  <button
                    onClick={cancelRequest}
                    className="rounded-xl border border-rose-900/80 bg-rose-950/40 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition"
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {role === 'donor' ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <section className="min-h-80 rounded-2xl border border-slate-800 bg-slate-900/70 p-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Navigation className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Your Live Route to Hospital</h2>
                    <p className="text-xs text-slate-400">
                      Real-time road transit to {request?.hospitalName}
                    </p>
                  </div>
                </div>
                {sharing && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    GPS Streaming Active
                  </span>
                )}
              </div>

              {/* Turn-by-Turn Mobile Google Maps Navigation Link */}
              {request?.hospitalLocation && ['accepted', 'en_route'].includes(myMatch?.status) && (
                <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                      <Navigation className="h-4 w-4" /> Turn-by-Turn Mobile Navigation
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      Direct Google Maps App
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${request.hospitalLocation.latitude},${request.hospitalLocation.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 py-3.5 px-4 text-sm font-bold text-white shadow-xl shadow-emerald-950/50 hover:from-emerald-500 hover:to-teal-500 transition-all hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Open Turn-by-Turn Navigation in Google Maps App ↗</span>
                  </a>
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Launches Google Maps with live voice-guided driving directions directly to <strong>{request.hospitalName}</strong>
                  </p>
                </div>
              )}

              {/* Live Interactive Road Map */}
              {request?.hospitalLocation && (
                <div className="mt-5">
                  <LiveMap
                    hospital={request.hospitalLocation}
                    donors={donorLocation ? [{ id: myMatch?.id || 'you', name: 'You', position: donorLocation }] : []}
                  />
                </div>
              )}

              {/* Device GPS Permission & Realtime Streaming Status Card */}
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${sharing ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {sharing ? 'Exact Device GPS Stream Active' : 'Device GPS Inactive'}
                    </span>
                  </div>
                  {accuracy != null && sharing && (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-300">
                      ±{Math.round(accuracy)}m device accuracy
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {sharing
                    ? `Your phone's exact coordinates are transmitting live to ${request?.hospitalName} trauma unit. Ephemeral tracking automatically ceases when you arrive within 150m.`
                    : 'LifePulse requires browser device location permission to guide your transit and provide real-time ETA to the hospital.'}
                </p>

                {notice && (
                  <p className="mt-3 text-xs font-medium text-emerald-300 bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-2.5">
                    {notice}
                  </p>
                )}

                {donorLocation && (
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 border-t border-slate-900 pt-3">
                    <span>GPS: <strong>{donorLocation.latitude.toFixed(5)}, {donorLocation.longitude.toFixed(5)}</strong></span>
                    {lastGpsUpdate && <span>Updated: <strong>{lastGpsUpdate}</strong></span>}
                  </div>
                )}

                {!sharing && ['accepted', 'en_route'].includes(myMatch?.status) && (
                  <button
                    type="button"
                    onClick={startSharing}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition"
                  >
                    <LocateFixed className="h-4 w-4" /> Grant / Restart Exact GPS Access
                  </button>
                )}
              </div>

              {myMatch?.status === 'reached' && (
                <p className="mt-5 flex items-center gap-2 text-emerald-300 font-semibold bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-xl">
                  <CheckCircle2 className="h-5 w-5" /> Hospital destination reached. Ephemeral location sharing has stopped.
                </p>
              )}

              {myMatch?.status === 'donated' && (
                <div className="mt-5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 p-4 text-emerald-300">
                  <p className="font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" /> Donation Recorded by Hospital!
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Thank you for answering this emergency dispatch. You have saved a life.
                  </p>
                  <button
                    onClick={() => setCelebrationModal(true)}
                    className="mt-3 flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Celebrate on Hero Wall
                  </button>
                </div>
              )}
            </section>

            <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
              <div>
                <h3 className="font-bold text-white">Emergency Dispatch Status</h3>
                <p className="mt-2 text-sm font-semibold capitalize text-emerald-400">{myMatch?.status || 'Loading your match'}</p>
              </div>

              {myMatch?.distanceRemaining != null && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Distance to Hospital</span>
                  <p className="text-xl font-black text-white mt-0.5">{(myMatch.distanceRemaining / 1000).toFixed(1)} km</p>
                </div>
              )}

              {myMatch?.etaSeconds != null && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Estimated Travel Time</span>
                  <p className="text-xl font-black text-rose-400 mt-0.5">{Math.ceil(myMatch.etaSeconds / 60)} min</p>
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-200 block mb-1">Destination Facility:</span>
                <p className="text-white font-medium">{request?.hospitalName}</p>
                {request?.hospitalLocation && (
                  <p className="text-[11px] font-mono text-slate-500 mt-1">
                    {request.hospitalLocation.latitude.toFixed(4)}, {request.hospitalLocation.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-white">
                  <Car className="h-5 w-5 text-rose-400" /> Donors in Transit (Real-Time GPS)
                </h3>
                <span className="text-xs font-mono text-slate-400">Sync: 2.5s</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Hospital emergency station monitoring live positions of traveling responders.
              </p>

              {request?.hospitalLocation && (
                <div className="mt-5">
                  <LiveMap hospital={request.hospitalLocation} donors={mapPoints} />
                </div>
              )}

              <div className="mt-5 space-y-4">
                {matches.filter((m) => ['accepted', 'en_route', 'reached', 'donated'].includes(m.status)).map((m) => (
                  <article key={m.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <b>{m.donor?.fullName || 'Verified donor'}</b>
                        <span className="ml-2 rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300 font-bold">{m.donor?.bloodGroup}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.donorCurrentLocation ? (
                          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                            Live GPS Streaming
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                            Awaiting device GPS
                          </span>
                        )}
                        <span className="text-xs uppercase text-emerald-300 font-bold">{m.status}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Match score {m.score} · {m.distance} km initial
                      {m.distanceRemaining != null ? ` · ${(m.distanceRemaining / 1000).toFixed(1)} km remaining` : ''}
                      {m.etaSeconds != null ? ` · ${Math.ceil(m.etaSeconds / 60)} min ETA` : ''}
                    </p>
                    {m.donorCurrentLocation && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <MapPin className="h-3.5 w-3.5 text-rose-400" /> GPS Coordinates: {m.donorCurrentLocation.latitude.toFixed(5)}, {m.donorCurrentLocation.longitude.toFixed(5)}
                      </p>
                    )}
                    {['accepted', 'en_route', 'reached'].includes(m.status) && (
                      <button
                        onClick={() => completeDonation(m.id)}
                        className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Confirm donation complete
                      </button>
                    )}
                  </article>
                ))}
                {matches.filter((m) => ['accepted', 'en_route', 'reached', 'donated'].includes(m.status)).length === 0 && (
                  <p className="text-sm text-slate-500">Waiting for donor responses. Next escalation batch runs every 30 seconds.</p>
                )}
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-white">
                  <Shield className="h-5 w-5 text-emerald-400" /> Identified Donors ({matches.length})
                </h3>
                <span className="text-xs text-slate-400 font-mono">Matched by Blood & Distance</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Filtered automatically based on recipient blood compatibility, medical clearance, and response radius.
              </p>

              <div className="mt-4 space-y-3">
                {matches.filter((m) => ['alerted', 'expired', 'declined'].includes(m.status)).map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">#{m.rank || 1}</span>
                          <span className="font-semibold text-white text-sm">{m.donor?.fullName || 'Verified Donor'}</span>
                          <span className="rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300 font-bold">
                            {m.donor?.bloodGroup}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          📍 {m.donor?.homeLocality || 'Verified Area'} · <strong>{m.distance} km</strong> away
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        m.status === 'alerted'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : m.status === 'declined'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {m.status === 'alerted' ? '📡 Awaiting Response' : m.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span>Match Score: <strong className="text-slate-300">{m.score}</strong></span>
                      <span>Screening: <strong className="text-emerald-400">Verified Certificate</strong></span>
                    </div>
                  </div>
                ))}
                {matches.length === 0 && <p className="text-sm text-slate-500">No compatible donors found in the current radius.</p>}
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Post-Donation Celebration Prompt Modal */}
      {celebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-slate-900 p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl text-amber-400 border border-amber-500/20">
              ❤️
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">You helped save a life!</h2>
            <p className="mt-2 text-sm text-slate-300">
              The hospital has confirmed your successful blood donation.
            </p>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">“Would you like us to celebrate your contribution publicly?”</p>
              <p>Choosing yes will feature your first name, blood group, and district on the public LifePulse Hero Wall with a custom share card.</p>
            </div>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => handleConsentChoice(true)}
                className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 py-3 font-semibold text-white shadow-lg hover:from-rose-500 hover:to-pink-500 transition"
              >
                YES, CELEBRATE PUBLICLY →
              </button>
              <button
                onClick={() => handleConsentChoice(false)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                KEEP PRIVATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingPage;
