/**
 * Registrasi Service Worker untuk kapabilitas PWA luring (offline emergency caching).
 */

export interface SWRegistrationResult {
  supported: boolean;
  registered: boolean;
  scope?: string;
  error?: string;
}

export async function registerServiceWorker(): Promise<SWRegistrationResult> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return {
      supported: false,
      registered: false,
      error: 'Service worker is not supported in this environment.',
    };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return {
      supported: true,
      registered: true,
      scope: registration.scope,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      supported: true,
      registered: false,
      error: message,
    };
  }
}
