import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Navigation, ArrowLeft, Shield, Car, MapPin, CheckCircle2, LocateFixed, Phone, XCircle, Award, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    const timer = setInterval(refresh, 5000);
    return () => {
      clearInterval(timer);
      if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
    };
  }, [refresh]);

  const startSharing = () => {
    if (!navigator.geolocation) {
      setNotice('This browser does not support location sharing.');
      return;
    }
    if (!myMatch || !['accepted', 'en_route'].includes(myMatch.status)) {
      setNotice('Location sharing is available only for an accepted request.');
      return;
    }
    setNotice('Waiting for your location permission…');
    watchId.current = navigator.geolocation.watchPosition(
      async ({ coords }) => {
        try {
          const { data } = await api.post(`/donors/matches/${myMatch.id}/location`, {
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          setMyMatch(data.match);
          setNotice(data.message);
          setSharing(data.trackingActive);
          if (!data.trackingActive && watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
          }
        } catch (e: any) {
          setNotice(e.response?.data?.error || 'Location update failed.');
          setSharing(false);
          if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        }
      },
      (e) => setNotice(e.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    setSharing(true);
  };

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

  const donorLocation = myMatch?.donorCurrentLocation;
  const mapPoints = matches.filter((m: any) => m.donorCurrentLocation).map((m: any) => ({ id: m.id, name: m.donor?.fullName || 'Donor', position: m.donorCurrentLocation }));
  const latitudes = [...mapPoints.map((point: any) => point.position.latitude), request?.hospitalLocation?.latitude].filter(Number.isFinite);
  const longitudes = [...mapPoints.map((point: any) => point.position.longitude), request?.hospitalLocation?.longitude].filter(Number.isFinite);
  const minLat = latitudes.length ? Math.min(...latitudes) : 0, maxLat = latitudes.length ? Math.max(...latitudes) : 1;
  const minLon = longitudes.length ? Math.min(...longitudes) : 0, maxLon = longitudes.length ? Math.max(...longitudes) : 1;
  const xy = (lat: number, lon: number) => ({ x: 34 + ((lon - minLon) / (maxLon - minLon || 1)) * 532, y: 26 + (1 - (lat - minLat) / (maxLat - minLat || 1)) * 238 });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white transition">
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
              <Navigation className="h-8 w-8 text-rose-400" />
              <h2 className="mt-5 text-xl font-bold">Your trip to the hospital</h2>
              <p className="mt-2 text-sm text-slate-400">
                Precise coordinates are shared only with the requesting medical center, only while en route.
              </p>
              {donorLocation && (
                <p className="mt-5 text-sm text-slate-300">
                  Latest location: {donorLocation.latitude.toFixed(4)}, {donorLocation.longitude.toFixed(4)}
                </p>
              )}
              {notice && <p className="mt-4 text-sm text-emerald-300">{notice}</p>}
              {myMatch?.status === 'reached' && (
                <p className="mt-5 flex items-center gap-2 text-emerald-300 font-semibold">
                  <CheckCircle2 className="h-5 w-5" /> Hospital reached. Ephemeral location sharing has stopped.
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
              {['accepted', 'en_route'].includes(myMatch?.status) && (
                <button
                  disabled={sharing}
                  onClick={startSharing}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-50 transition"
                >
                  <LocateFixed className="h-4 w-4" />
                  {sharing ? 'Sharing location…' : 'Start live location sharing'}
                </button>
              )}
            </section>
            <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h3 className="font-bold">Dispatch status</h3>
              <p className="mt-3 text-sm text-slate-300 capitalize">{myMatch?.status || 'Loading your match'}</p>
              {myMatch?.distanceRemaining != null && (
                <p className="mt-3 text-sm text-slate-400">
                  Distance remaining: <strong>{(myMatch.distanceRemaining / 1000).toFixed(1)} km</strong>
                </p>
              )}
              {myMatch?.etaSeconds != null && (
                <p className="mt-1 text-sm text-slate-400">
                  Estimated travel: <strong>{Math.ceil(myMatch.etaSeconds / 60)} min</strong>
                </p>
              )}
            </aside>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h3 className="flex items-center gap-2 font-bold">
                <Car className="h-5 w-5 text-rose-400" /> Donors in transit
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Exact positions are streamed ephemerally for accepted active responders.
              </p>

              {request?.hospitalLocation && (
                <div className="mt-5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  <svg viewBox="0 0 600 300" role="img" aria-label="Approximate donor and hospital positions" className="h-64 w-full">
                    <rect width="600" height="300" fill="#07111f" />
                    {Array.from({ length: 6 }, (_, i) => (
                      <path key={`v${i}`} d={`M${i * 120} 0 L${i * 120 + 70} 300`} stroke="#1e293b" strokeWidth="15" />
                    ))}
                    {Array.from({ length: 5 }, (_, i) => (
                      <path key={`h${i}`} d={`M0 ${i * 75 + 20} L600 ${i * 75}`} stroke="#1e293b" strokeWidth="11" />
                    ))}
                    {mapPoints.map((point: any) => {
                      const pos = xy(point.position.latitude, point.position.longitude);
                      const hospital = xy(request.hospitalLocation.latitude, request.hospitalLocation.longitude);
                      return (
                        <g key={point.id}>
                          <path d={`M${pos.x} ${pos.y} L${hospital.x} ${hospital.y}`} stroke="#fb7185" strokeDasharray="7 6" strokeWidth="3" />
                          <circle cx={pos.x} cy={pos.y} r="9" fill="#fb7185" />
                          <text x={pos.x + 12} y={pos.y - 10} fill="#f8fafc" fontSize="12">{point.name}</text>
                        </g>
                      );
                    })}
                    {(() => {
                      const pos = xy(request.hospitalLocation.latitude, request.hospitalLocation.longitude);
                      return (
                        <g>
                          <circle cx={pos.x} cy={pos.y} r="12" fill="#34d399" />
                          <text x={pos.x + 14} y={pos.y + 5} fill="#d1fae5" fontSize="13">Hospital</text>
                        </g>
                      );
                    })()}
                  </svg>
                  <p className="px-3 pb-3 text-xs text-slate-500">
                    Approximate position view · Ephemeral straight-line radar
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-4">
                {matches.filter((m) => ['accepted', 'en_route', 'reached', 'donated'].includes(m.status)).map((m) => (
                  <article key={m.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <b>{m.donor?.fullName || 'Verified donor'}</b>
                        <span className="ml-2 rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">{m.donor?.bloodGroup}</span>
                      </div>
                      <span className="text-xs uppercase text-emerald-300 font-bold">{m.status}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Match score {m.score} · {m.distance} km initial distance
                      {m.distanceRemaining != null ? ` · ${(m.distanceRemaining / 1000).toFixed(1)} km remaining` : ''}
                      {m.etaSeconds != null ? ` · ${Math.ceil(m.etaSeconds / 60)} min ETA` : ''}
                    </p>
                    {m.donorCurrentLocation && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> GPS {m.donorCurrentLocation.latitude.toFixed(4)}, {m.donorCurrentLocation.longitude.toFixed(4)}
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
              <h3 className="flex items-center gap-2 font-bold">
                <Shield className="h-5 w-5 text-emerald-400" /> Ranked match queue
              </h3>
              <div className="mt-4 space-y-2">
                {matches.filter((m) => ['alerted', 'expired', 'declined'].includes(m.status)).map((m) => (
                  <div key={m.id} className="flex justify-between rounded-lg bg-slate-950/50 p-3 text-sm">
                    <span>{m.donor?.fullName || 'Verified donor'} · {m.donor?.bloodGroup}</span>
                    <span className="text-xs text-slate-400 uppercase">{m.status}</span>
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
