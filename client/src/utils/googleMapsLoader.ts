type GoogleMapsApi = any;

declare global {
  interface Window {
    google?: GoogleMapsApi;
    __raktaRunMapsPromise?: Promise<GoogleMapsApi>;
  }
}

export function loadGoogleMaps(apiKey: string): Promise<GoogleMapsApi> {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (window.__raktaRunMapsPromise) return window.__raktaRunMapsPromise;

  const google = window.google ?? (window.google = {});
  const maps = google.maps ?? (google.maps = {});
  let bootstrapPromise: Promise<void> | undefined;
  const requestedLibraries = new Set<string>();

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
        script.onerror = () => reject(new Error('Google Maps could not load. Check API key and network permissions.'));
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

