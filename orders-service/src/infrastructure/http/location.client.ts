import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios } from 'axios';
import { LOCATION_SERVICE_URL } from '../config/constants';
import { LocationPort } from '../../application/ports/location.port';

@Injectable()
export class LocationClient implements LocationPort {
  private readonly logger = new Logger(LocationClient.name);
  private readonly httpClient: Axios;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>(LOCATION_SERVICE_URL) ?? 'http://127.0.0.1:5562';
    this.httpClient = axios.create({ baseURL, timeout: 5000 });
  }

  async getCityName(cityId: string): Promise<string> {
    try {
      const response = await this.httpClient.get(`/city/${cityId}`);
      return response.data.name;
    } catch (error) {
      this.logger.error(`Failed to get city name for ${cityId}: ${error.message}`);
      return 'Ciudad desconocida';
    }
  }
}
