/**
 * @file geo-watchdog.ts
 * @description Continuous GPS watchdog for citizen emergency reporting with accuracy filter.
 */

export interface GeoWatchdogStatus {
  isMonitoring: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  isHighAccuracy: boolean;
  error: string | null;
}

export class GeolocationWatchdog {
  private watchId: number | null = null;
  private currentStatus: GeoWatchdogStatus = {
    isMonitoring: false,
    latitude: null,
    longitude: null,
    accuracyMeters: null,
    isHighAccuracy: false,
    error: null,
  };

  public getStatus(): GeoWatchdogStatus {
    return { ...this.currentStatus };
  }

  public start(
    onUpdate?: (status: GeoWatchdogStatus) => void,
    accuracyThresholdMeters: number = 20.0
  ): boolean {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.currentStatus.error = 'GEOLOCATION_UNSUPPORTED';
      if (onUpdate) onUpdate(this.getStatus());
      return false;
    }

    this.currentStatus.isMonitoring = true;
    this.currentStatus.error = null;

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.currentStatus.latitude = pos.coords.latitude;
          this.currentStatus.longitude = pos.coords.longitude;
          this.currentStatus.accuracyMeters = pos.coords.accuracy;
          this.currentStatus.isHighAccuracy = pos.coords.accuracy <= accuracyThresholdMeters;
          this.currentStatus.error = null;
          if (onUpdate) onUpdate(this.getStatus());
        },
        (err) => {
          this.currentStatus.error = err.message || 'GEOLOCATION_ERROR';
          if (onUpdate) onUpdate(this.getStatus());
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
      return true;
    } catch {
      this.currentStatus.error = 'WATCH_FAILED';
      this.currentStatus.isMonitoring = false;
      if (onUpdate) onUpdate(this.getStatus());
      return false;
    }
  }

  public stop(): void {
    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.currentStatus.isMonitoring = false;
  }
}
