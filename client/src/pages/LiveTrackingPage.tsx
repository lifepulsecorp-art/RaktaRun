import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Navigation, ArrowLeft, Shield, Car, MapPin, Clock, CheckCircle2, LocateFixed } from 'lucide-react';
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
  const watchId = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      if (role === 'donor') {
        const { data } = await api.get(`/donors/me/matches/${requestId}`); setRequest(data.request); setMyMatch(data.match);
      } else {
        const { data } = await api.get(`/requests/${requestId}`); setRequest(data.request);
        const { data: found } = await api.get(`/hospitals/${data.request.hospitalId}/requests/${requestId}/matches`); setMatches(found);
      }
      setError('');
    } catch (e: any) { setError(e.response?.data?.error || 'Tracking information is unavailable.'); }
  }, [requestId, role]);
  useEffect(() => { refresh(); const timer = setInterval(refresh, 5000); return () => { clearInterval(timer); if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current); }; }, [refresh]);

  const startSharing = () => {
    if (!navigator.geolocation) { setNotice('This browser does not support location sharing.'); return; }
    if (!myMatch || !['accepted', 'en_route'].includes(myMatch.status)) { setNotice('Location sharing is available only for an accepted request.'); return; }
    setNotice('Waiting for your location permission…');
    watchId.current = navigator.geolocation.watchPosition(async ({ coords }) => {
      try {
        const { data } = await api.post(`/donors/matches/${myMatch.id}/location`, { latitude: coords.latitude, longitude: coords.longitude });
        setMyMatch(data.match); setNotice(data.message); setSharing(data.trackingActive);
        if (!data.trackingActive && watchId.current !== null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; }
      } catch (e: any) { setNotice(e.response?.data?.error || 'Location update failed.'); setSharing(false); if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); }
    }, (e) => setNotice(e.message), { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    setSharing(true);
  };

  const completeDonation = async (matchId: string) => {
    if (!request?.hospitalId) return;
    try { await api.post(`/hospitals/${request.hospitalId}/requests/${requestId}/matches/${matchId}/complete`); await refresh(); }
    catch (e: any) { setError(e.response?.data?.error || 'Could not complete donation.'); }
  };
  const cancelRequest = async () => {
    if (!request?.hospitalId) return;
    try { await api.post(`/hospitals/${request.hospitalId}/requests/${requestId}/cancel`); await refresh(); }
    catch (e: any) { setError(e.response?.data?.error || 'Could not cancel request.'); }
  };

  const donorLocation = myMatch?.donorCurrentLocation;
  const mapPoints = matches.filter((m:any) => m.donorCurrentLocation).map((m:any) => ({ id: m.id, name: m.donor?.fullName || 'Donor', position: m.donorCurrentLocation }));
  const latitudes = [...mapPoints.map((point:any)=>point.position.latitude), request?.hospitalLocation?.latitude].filter(Number.isFinite);
  const longitudes = [...mapPoints.map((point:any)=>point.position.longitude), request?.hospitalLocation?.longitude].filter(Number.isFinite);
  const minLat = latitudes.length ? Math.min(...latitudes) : 0, maxLat = latitudes.length ? Math.max(...latitudes) : 1;
  const minLon = longitudes.length ? Math.min(...longitudes) : 0, maxLon = longitudes.length ? Math.max(...longitudes) : 1;
  const xy = (lat:number, lon:number) => ({ x: 34 + ((lon-minLon)/(maxLon-minLon || 1))*532, y: 26 + (1-(lat-minLat)/(maxLat-minLat || 1))*238 });
  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-900/70"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div className="flex items-center gap-4"><button onClick={() => navigate(-1)} className="rounded-xl border border-slate-800 p-2 text-slate-400"><ArrowLeft className="h-4 w-4"/></button><div><h1 className="font-bold">Live emergency dispatch</h1><span className="text-xs text-rose-300">Request #{requestId}</span></div></div><span className="text-xs text-slate-400">{request?.status?.toUpperCase() || 'LOADING'}</span></div></header>
    <main className="mx-auto max-w-7xl px-6 py-8">
      {error && <p role="alert" className="mb-5 rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</p>}
      {request && <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-slate-400">{request.hospitalName}</p><h2 className="mt-1 text-xl font-bold">{request.bloodGroup} · {request.unitsRequired} units {request.component?.replace('_',' ')}</h2><p className="mt-1 text-sm text-slate-400">{request.urgency} priority · {request.radiusKm} km search radius</p></div>{role !== 'donor' && ['searching','matched'].includes(request.status) && <button onClick={cancelRequest} className="rounded-lg border border-rose-900 px-3 py-2 text-sm text-rose-300">Cancel request</button>}</div></div>}
      {role === 'donor' ? <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="min-h-80 rounded-2xl border border-slate-800 bg-slate-900/70 p-7"><Navigation className="h-8 w-8 text-rose-400"/><h2 className="mt-5 text-xl font-bold">Your trip to the hospital</h2><p className="mt-2 text-sm text-slate-400">Precise location is visible only to the requesting hospital, only while this request is active.</p>{donorLocation && <p className="mt-5 text-sm text-slate-300">Latest location: {donorLocation.latitude.toFixed(4)}, {donorLocation.longitude.toFixed(4)}</p>}{notice && <p className="mt-4 text-sm text-emerald-300">{notice}</p>}{myMatch?.status === 'reached' && <p className="mt-5 flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-5 w-5"/> Hospital reached. Location sharing has stopped.</p>}{myMatch?.status === 'donated' && <p className="mt-5 text-emerald-300">Thank you. The hospital recorded your donation.</p>}{['accepted','en_route'].includes(myMatch?.status) && <button disabled={sharing} onClick={startSharing} className="mt-6 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-semibold disabled:opacity-50"><LocateFixed className="h-4 w-4"/>{sharing?'Sharing location…':'Start live location sharing'}</button>}</section><aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h3 className="font-bold">Dispatch status</h3><p className="mt-3 text-sm text-slate-300">{myMatch?.status || 'Loading your match'}</p>{myMatch?.distanceRemaining != null && <p className="mt-3 text-sm text-slate-400">Distance remaining: {(myMatch.distanceRemaining/1000).toFixed(1)} km</p>}{myMatch?.etaSeconds != null && <p className="mt-1 text-sm text-slate-400">Estimated travel: {Math.ceil(myMatch.etaSeconds/60)} min</p>}</aside></div>
        : <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h3 className="flex items-center gap-2 font-bold"><Car className="h-5 w-5 text-rose-400"/> Donors in transit</h3><p className="mt-1 text-xs text-slate-400">Exact positions are shared only for accepted active matches.</p>
          {request?.hospitalLocation && <div className="mt-5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><svg viewBox="0 0 600 300" role="img" aria-label="Approximate donor and hospital positions" className="h-64 w-full"><rect width="600" height="300" fill="#07111f"/>{Array.from({length:6},(_,i)=><path key={`v${i}`} d={`M${i*120} 0 L${i*120+70} 300`} stroke="#1e293b" strokeWidth="15"/>)}{Array.from({length:5},(_,i)=><path key={`h${i}`} d={`M0 ${i*75+20} L600 ${i*75}`} stroke="#1e293b" strokeWidth="11"/>)}{mapPoints.map((point:any)=>{const pos=xy(point.position.latitude,point.position.longitude);const hospital=xy(request.hospitalLocation.latitude,request.hospitalLocation.longitude);return <g key={point.id}><path d={`M${pos.x} ${pos.y} L${hospital.x} ${hospital.y}`} stroke="#fb7185" strokeDasharray="7 6" strokeWidth="3"/><circle cx={pos.x} cy={pos.y} r="9" fill="#fb7185"/><text x={pos.x+12} y={pos.y-10} fill="#f8fafc" fontSize="12">{point.name}</text></g>;})}{(()=>{const pos=xy(request.hospitalLocation.latitude,request.hospitalLocation.longitude);return <g><circle cx={pos.x} cy={pos.y} r="12" fill="#34d399"/><text x={pos.x+14} y={pos.y+5} fill="#d1fae5" fontSize="13">Hospital</text></g>;})()}</svg><p className="px-3 pb-3 text-xs text-slate-500">Approximate position view · straight-line estimates, not road navigation</p></div>}
          <div className="mt-5 space-y-4">{matches.filter((m)=>['accepted','en_route','reached','donated'].includes(m.status)).map((m)=><article key={m.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><b>{m.donor?.fullName || 'Verified donor'}</b><span className="ml-2 rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">{m.donor?.bloodGroup}</span></div><span className="text-xs uppercase text-emerald-300">{m.status}</span></div><p className="mt-2 text-xs text-slate-400">Match score {m.score} · {m.distance} km initial distance {m.distanceRemaining != null ? `· ${(m.distanceRemaining/1000).toFixed(1)} km remaining` : ''} {m.etaSeconds != null ? `· ${Math.ceil(m.etaSeconds/60)} min ETA` : ''}</p>{m.donorCurrentLocation && <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3"/>GPS {m.donorCurrentLocation.latitude.toFixed(4)}, {m.donorCurrentLocation.longitude.toFixed(4)}</p>}{['accepted','en_route','reached'].includes(m.status)&&<button onClick={()=>completeDonation(m.id)} className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5"/> Confirm donation complete</button>}</article>)}{matches.filter((m)=>['accepted','en_route','reached','donated'].includes(m.status)).length===0&&<p className="text-sm text-slate-500">Waiting for donor responses. New batches are sent every two minutes.</p>}</div></section><aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><h3 className="flex items-center gap-2 font-bold"><Shield className="h-5 w-5 text-emerald-400"/> Ranked match queue</h3><div className="mt-4 space-y-2">{matches.filter((m)=>['alerted','expired','declined'].includes(m.status)).map((m)=><div key={m.id} className="flex justify-between rounded-lg bg-slate-950/50 p-3 text-sm"><span>{m.donor?.fullName || 'Verified donor'} · {m.donor?.bloodGroup}</span><span className="text-xs text-slate-400">{m.status}</span></div>)}{matches.length===0&&<p className="text-sm text-slate-500">No compatible donors found in the current radius.</p>}</div></aside></div>}
      {request && <p className="mt-6 flex items-center gap-2 text-xs text-slate-500"><Clock className="h-4 w-4"/> Updates every 5 seconds · Donor location sharing stops when the hospital is reached or the request closes.</p>}
    </main>
  </div>;
};

export default LiveTrackingPage;
