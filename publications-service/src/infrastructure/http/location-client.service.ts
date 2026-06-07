import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LOCATION_SERVICE_URL } from '../config/constants';

interface CityResponse {
  id: string;
  name: string;
  departmentId: string;
}

@Injectable()
export class LocationClient {
  private readonly logger = new Logger('LocationClient');
  private readonly baseUrl: string;
  private readonly cityCache = new Map<string, string>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(LOCATION_SERVICE_URL) || 'http://127.0.0.1:5562';
  }

  async getCityNames(cityIds: string[]): Promise<Map<string, string>> {
    if (cityIds.length === 0) return new Map();

    const result = new Map<string, string>();
    const missing: string[] = [];

    for (const id of cityIds) {
      if (this.cityCache.has(id)) {
        result.set(id, this.cityCache.get(id)!);
      } else {
        missing.push(id);
      }
    }

    if (missing.length === 0) return result;

    const responses = await Promise.allSettled(
      missing.map(id =>
        firstValueFrom(
          this.httpService.get<CityResponse>(`${this.baseUrl}/city/${id}`),
        ),
      ),
    );

    for (let i = 0; i < missing.length; i++) {
      const response = responses[i];
      if (response.status === 'fulfilled') {
        const city = response.value.data;
        this.cityCache.set(city.id, city.name);
        result.set(city.id, city.name);
      } else {
        this.logger.warn(`Failed to fetch city ${missing[i]}: ${response.reason?.message || 'unknown'}`);
      }
    }

    return result;
  }
}
