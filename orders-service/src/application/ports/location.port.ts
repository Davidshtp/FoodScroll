export interface LocationPort {
  getCityName(cityId: string): Promise<string>;
}

export const LOCATION_PORT = 'LOCATION_PORT';
