export const GEOCODING_SERVICE_PORT = Symbol('GEOCODING_SERVICE_PORT');

export interface GeocodingResult {
  mainAddress: string | null;
  cityName: string | null;
  departmentName: string | null;
  latitude: number;
  longitude: number;
}

export interface GeocodingServicePort {
  reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<GeocodingResult>;
}
