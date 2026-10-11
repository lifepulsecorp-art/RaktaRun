import React, { useEffect, useRef, useState } from 'react';
import { MapPin, X, Navigation, Check, Loader2, Sparkles } from 'lucide-react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import api from '../utils/api';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoordinates?: { latitude: number; longitude: number };
  initialLocality?: string;
  onSaved: (coordinates: { latitude: number; longitude: number }, locality: string) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  initialCoordinates,
  initialLocality = 'Manipal (576104)',
  onSaved,
}) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const geocoder = useRef<any>(null);

  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>(() => ({
    latitude: initialCoordinates?.latitude || 13.3525,
    longitude: initialCoordinates?.longitude || 74.792,
  }));
  const [locality, setLocality] = useState<string>(initialLocality);
  const [loadingMap, setLoadingMap] = useState<boolean>(true);
  const [locatingDevice, setLocatingDevice] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');
  const [error, setError] = useState<string>('');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      const lat = initialCoordinates?.latitude || 13.3525;
      const lng = initialCoordinates?.longitude || 74.792;
      setCoords({ latitude: lat, longitude: lng });
      setLocality(initialLocality || 'Manipal (576104)');
      setNotice('');
      setError('');
    }
  }, [isOpen, initialCoordinates, initialLocality]);

  // Reverse geocoding helper
  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoder.current) return;
    geocoder.current.geocode(
      { location: { lat, lng } },
      (results: any[], status: string) => {
        if (status === 'OK' && results?.[0]) {
          const comp = results[0].address_components || [];
          const sublocality = comp.find((c: any) => c.types.includes('sublocality') || c.types.includes('locality'))?.long_name;
          const district = comp.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name;
          const postal = comp.find((c: any) => c.types.includes('postal_code'))?.long_name;

          let suggested = sublocality || results[0].formatted_address.split(',')[0];
          if (district && !suggested.includes(district)) suggested += `, ${district}`;
          if (postal) suggested += ` (${postal})`;

          if (suggested) {
            setLocality(suggested);
          }
        }
      }
    );
  };

  // Initialize Google Maps when modal is active
  useEffect(() => {
    if (!isOpen) return;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setError('Google Maps API key is not configured.');
      setLoadingMap(false);
      return;
    }

    let isCancelled = false;
    setLoadingMap(true);

    loadGoogleMaps(apiKey)
      .then(async (mapsApi) => {
        if (isCancelled || !mapElement.current) return;

        const centerLat = coords.latitude;
        const centerLng = coords.longitude;

        map.current = new mapsApi.Map(mapElement.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        geocoder.current = new mapsApi.Geocoder();

        // Create draggable marker
        marker.current = new mapsApi.Marker({
          position: { lat: centerLat, lng: centerLng },
          map: map.current,
          draggable: true,
          title: 'Drag to adjust your emergency base station',
          animation: mapsApi.Animation.DROP,
        });

        // Marker dragend listener
        marker.current.addListener('dragend', () => {
          const pos = marker.current.getPosition();
          const newLat = Math.round(pos.lat() * 100000) / 100000;
          const newLng = Math.round(pos.lng() * 100000) / 100000;
          setCoords({ latitude: newLat, longitude: newLng });
          reverseGeocode(newLat, newLng);
          setNotice('Pin updated: drag or click to adjust further');
        });

        // Map click listener to place marker
        map.current.addListener('click', (e: any) => {
          if (!e.latLng) return;
          marker.current.setPosition(e.latLng);
          const newLat = Math.round(e.latLng.lat() * 100000) / 100000;
          const newLng = Math.round(e.latLng.lng() * 100000) / 100000;
          setCoords({ latitude: newLat, longitude: newLng });
          reverseGeocode(newLat, newLng);
          setNotice('Pin updated: drag or click to adjust further');
        });

        setLoadingMap(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Could not load Google Maps.');
          setLoadingMap(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, apiKey]);

  // Use current device GPS
  const handleSnapToDeviceGps = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your device browser.');
      return;
    }

    setLocatingDevice(true);
    setNotice('Querying device high-accuracy GPS…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 100000) / 100000;
        const lng = Math.round(pos.coords.longitude * 100000) / 100000;

        setCoords({ latitude: lat, longitude: lng });
        if (map.current) {
          map.current.panTo({ lat, lng });
          map.current.setZoom(15);
        }
        if (marker.current) {
          marker.current.setPosition({ lat, lng });
        }
        reverseGeocode(lat, lng);
        setNotice(`✓ Device GPS acquired (±${Math.round(pos.coords.accuracy)}m accuracy)`);
        setLocatingDevice(false);
      },
      (err) => {
        setError(`Device GPS unavailable: ${err.message}`);
        setLocatingDevice(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/donors/me/preferences', {
        coordinates: coords,
        homeLocality: locality.trim(),
      });
      onSaved(coords, locality.trim());
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save default base location.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">Set Default Base Station</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click anywhere on the map or drag the pin marker to pin your emergency location
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Map Container & Interactive Surface */}
        <div className="relative h-60 w-full border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950 sm:h-80">
          <div ref={mapElement} className="h-full w-full" />

          {loadingMap && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/80 backdrop-blur-sm text-slate-600 dark:text-slate-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
              <span className="text-xs font-semibold">Loading interactive Google Map…</span>
            </div>
          )}

          {/* Quick Snap to GPS Button on Map */}
          <button
            type="button"
            onClick={handleSnapToDeviceGps}
            disabled={locatingDevice}
            className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold text-slate-800 shadow-md hover:bg-slate-50 transition active:scale-[0.98] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/95 dark:text-white dark:hover:bg-slate-800"
            title="Snap pin to your device's exact GPS coordinates"
          >
            {locatingDevice ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500 dark:text-rose-400" />
            ) : (
              <Navigation className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
            )}
            <span>Use Current GPS</span>
          </button>

          {/* Pin drag hint badge */}
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none rounded-lg bg-white/95 border border-slate-200 px-2.5 py-1 text-[11px] font-mono text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-950/90 dark:border-slate-800 dark:text-slate-300">
            <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" /> Click map or drag the red pin to adjust
          </div>
        </div>

        {/* Form Controls & Location Summary */}
        <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
          {notice && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Home Locality / Area Name
              </label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Manipal (576104) or Kadri, Mangaluru"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500"
              />
              <span className="block mt-1 text-[11px] text-slate-500">
                Shown to hospitals as your approximate base district.
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-950/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Pin Coordinates
              </span>
              <p className="text-sm font-mono font-bold text-rose-600 dark:text-rose-300 mt-1">
                {coords.latitude.toFixed(5)}° N, {coords.longitude.toFixed(5)}° E
              </p>
              <span className="text-[11px] text-slate-500 mt-1">
                Used to compute exact distance filters for dispatches.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !locality.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950/30 transition active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving Location…</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Save Default Location</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;

