import { useEffect, useMemo, useRef, useState } from 'react';

type Coordinate = { latitude: number; longitude: number };
type MapPoint = { id: string; name: string; position: Coordinate };

interface LiveMapProps {
  hospital: Coordinate;
  donors: MapPoint[];
  className?: string;
}

type GoogleMapsApi = any;

declare global {
  interface Window {
    google?: GoogleMapsApi;
    __raktaRunMapsPromise?: Promise<GoogleMapsApi>;
  }
}

function loadGoogleMaps(apiKey: string): Promise<GoogleMapsApi> {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (window.__raktaRunMapsPromise) return window.__raktaRunMapsPromise;

  const google = window.google ?? (window.google = {});
  const maps = google.maps ?? (google.maps = {});
  let bootstrapPromise: Promise<void> | undefined;
  const requestedLibraries = new Set<string>();

  // Google recommends this bootstrap so importLibrary() loads the Maps API and
  // any additional libraries on demand.
  maps.importLibrary = (library: string, ...args: unknown[]) => {
    requestedLibraries.add(library);
    if (!bootstrapPromise) {
      bootstrapPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        const parameters = new URLSearchParams({
          key: apiKey,
          v: 'weekly',
          loading: 'async',
          libraries: [...requestedLibraries].join(','),
          callback: 'google.maps.__ib__',
        });
        maps.__ib__ = resolve;
        script.onerror = () => reject(new Error('Google Maps could not load. Check the key, enabled APIs, billing, and referrer restrictions.'));
        script.src = `https://maps.googleapis.com/maps/api/js?${parameters.toString()}`;
        script.nonce = document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce || '';
        document.head.appendChild(script);
      });
    }
    return bootstrapPromise.then(() => maps.importLibrary(library, ...args));
  };

  window.__raktaRunMapsPromise = maps.importLibrary('maps').then(() => maps);

  return window.__raktaRunMapsPromise!;
}

function distanceMeters(a: Coordinate, b: Coordinate): number {
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export default function LiveMap({ hospital, donors, className = '' }: LiveMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const hospitalMarker = useRef<any>(null);
  const donorMarkers = useRef(new Map<string, any>());
  const routeLines = useRef(new Map<string, any>());
  const routeRequests = useRef(new Map<string, { position: Coordinate; requestedAt: number }>());
  const [mapApi, setMapApi] = useState<GoogleMapsApi | null>(null);
  const [error, setError] = useState('');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

  const pointsKey = useMemo(() => JSON.stringify(donors), [donors]);

  useEffect(() => {
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setError('Add a Google Maps API key in client/.env to show the live road map.');
      return;
    }

    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(async (mapsApi) => {
        await mapsApi.importLibrary('maps');
        if (cancelled || !mapElement.current) return;
        map.current = new mapsApi.Map(mapElement.current, {
          center: { lat: hospital.latitude, lng: hospital.longitude },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        setMapApi(mapsApi);
        setError('');
      })
      .catch((loadError: Error) => {
        if (!cancelled) setError(loadError.message);
      });

    return () => { cancelled = true; };
  // The map instance is created once. Live coordinates are handled below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    if (!mapApi || !map.current) return;
    const googleMaps = mapApi;
    const currentMap = map.current;
    const hospitalPosition = { lat: hospital.latitude, lng: hospital.longitude };

    if (!hospitalMarker.current) {
      hospitalMarker.current = new googleMaps.Marker({
        map: currentMap,
        position: hospitalPosition,
        title: 'Hospital',
        label: { text: 'H', color: '#ffffff' },
      });
    } else {
      hospitalMarker.current.setPosition(hospitalPosition);
    }

    const activeIds = new Set(donors.map((donor) => donor.id));
    for (const [id, marker] of donorMarkers.current) {
      if (!activeIds.has(id)) {
        marker.setMap(null);
        donorMarkers.current.delete(id);
        routeLines.current.get(id)?.setMap(null);
        routeLines.current.delete(id);
        routeRequests.current.delete(id);
      }
    }

    const bounds = new googleMaps.LatLngBounds();
    bounds.extend(hospitalPosition);
    for (const donor of donors) {
      const donorPosition = { lat: donor.position.latitude, lng: donor.position.longitude };
      bounds.extend(donorPosition);
      let marker = donorMarkers.current.get(donor.id);
      if (!marker) {
        marker = new googleMaps.Marker({
          map: currentMap,
          position: donorPosition,
          title: donor.name,
          label: { text: 'D', color: '#ffffff' },
        });
        donorMarkers.current.set(donor.id, marker);
      } else {
        marker.setPosition(donorPosition);
        marker.setTitle(donor.name);
      }

      const priorRequest = routeRequests.current.get(donor.id);
      const shouldRefreshRoute = !priorRequest
        || distanceMeters(priorRequest.position, donor.position) >= 250
        || Date.now() - priorRequest.requestedAt >= 30000;
      if (shouldRefreshRoute) {
        const requestedAt = Date.now();
        routeRequests.current.set(donor.id, { position: donor.position, requestedAt });
        void googleMaps.importLibrary('routes').then(async ({ Route }: any) => {
          const { routes } = await Route.computeRoutes({
            origin: donorPosition,
            destination: hospitalPosition,
            travelMode: 'DRIVING',
            fields: ['path'],
          });
          const latest = routeRequests.current.get(donor.id);
          if (latest?.requestedAt !== requestedAt || !routes?.[0]) return;
          routeLines.current.get(donor.id)?.setMap(null);
          const lines = routes[0].createPolylines();
          const line = lines[0];
          if (line) {
            line.setOptions({ strokeColor: '#fb7185', strokeOpacity: 0.9, strokeWeight: 5 });
            line.setMap(currentMap);
            routeLines.current.set(donor.id, line);
          }
          routes[0].path?.forEach((point: any) => bounds.extend(point));
          currentMap.fitBounds(bounds, 48);
        }).catch((routeError: Error) => setError(`Could not calculate a road route: ${routeError.message}`));
      }
    }

    currentMap.fitBounds(bounds, 48);
  // Key the effect to actual coordinates to keep the 5-second polling from needlessly redrawing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapApi, hospital.latitude, hospital.longitude, pointsKey]);

  useEffect(() => () => {
    hospitalMarker.current?.setMap(null);
    hospitalMarker.current = null;
    for (const marker of donorMarkers.current.values()) marker.setMap(null);
    donorMarkers.current.clear();
    for (const line of routeLines.current.values()) line.setMap(null);
    routeLines.current.clear();
    routeRequests.current.clear();
    map.current = null;
  }, []);

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-950 ${className}`}>
      {error && (
        <div className="border-b border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}
      <div ref={mapElement} className="h-80 w-full" aria-label="Live donor and hospital road map" />
      <p className="px-3 py-2 text-xs text-slate-400">
        {donors.length ? 'Donor locations refresh live; road routes update as locations change.' : 'Hospital location shown. Donor position appears after the donor starts sharing GPS.'}
      </p>
    </div>
  );
}
