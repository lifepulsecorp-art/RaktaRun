import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Navigation, ArrowLeft, Shield, Car } from 'lucide-react';

export const LiveTrackingPage: React.FC = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get(`/hospitals/hosp_manipal_01/requests/${requestId || 'req_emergency_001'}/matches`);
        setMatches(res.data);
      } catch (err: any) {
        console.error('Error fetching live matches:', err);
      }
    };

    fetchMatches();
    const interval = setInterval(fetchMatches, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-none text-white">Live Emergency Dispatch Journey</h1>
              <span className="text-xs text-rose-400 font-medium">Request #{requestId || 'req_emergency_001'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-semibold text-emerald-400">Live GPS Stream Active</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Map Preview Box */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between min-h-[460px]">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-rose-500" /> Real-time Transit Telemetry
                </h3>
                <span className="text-xs text-slate-400">Block I incoming: Google Maps / Mapbox Live Route</span>
              </div>
              <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-12 text-center">
                <Car className="mx-auto h-12 w-12 text-rose-500 animate-bounce" />
                <p className="mt-4 font-semibold text-white">Donor Rahul Shetty is en route to Kasturba Hospital</p>
                <p className="mt-1 text-sm text-slate-400">Distance Remaining: ~650m • ETA: 420s (7 mins)</p>
                <div className="mt-6 mx-auto max-w-md bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500 to-emerald-400 h-full w-3/4 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
              <span>Hospital: Kasturba Hospital, Manipal (ICU Bed 4)</span>
              <span>Privacy Guard: Auto-terminates on hospital check-in</span>
            </div>
          </div>

          {/* Right: En Route Donors List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" /> Matched Heroes ({matches.length})
            </h3>
            <p className="text-xs text-slate-400 mt-1">Screened & Verified Udupi/Mangalore Donors</p>

            <div className="mt-6 space-y-4">
              {matches.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{m.donor?.fullName || 'Rahul Shetty'}</span>
                    <span className="rounded bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-400">
                      {m.donor?.bloodGroup || 'O+'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Status: <span className="text-emerald-400 font-semibold uppercase">{m.status}</span></p>
                  <p className="mt-1 text-xs text-slate-400">Match Compatibility Score: {m.score} / 150</p>
                  <p className="mt-1 text-xs text-slate-400">Distance: {m.distance} km</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveTrackingPage;

