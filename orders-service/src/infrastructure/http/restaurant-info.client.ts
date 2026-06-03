import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios } from 'axios';
import { HEADER_SERVICE_SECRET, SERVICE_SECRET, RESTAURANT_SERVICE_URL } from '../config/constants';
import { RestaurantInfoPort, RestaurantInfo } from '../../application/ports/restaurant-info.port';

@Injectable()
export class RestaurantInfoClient implements RestaurantInfoPort {
  private readonly logger = new Logger(RestaurantInfoClient.name);
  private readonly httpClient: Axios;
  private readonly serviceSecret: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>(RESTAURANT_SERVICE_URL) ?? 'http://127.0.0.1:5564';
    const secret = this.configService.get<string>(SERVICE_SECRET);
    if (!secret) {
      throw new Error('SERVICE_SECRET not configured');
    }
    this.serviceSecret = secret;
    this.httpClient = axios.create({ baseURL, timeout: 5000 });
  }

  async getRestaurantInfo(restaurantId: string): Promise<RestaurantInfo> {
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
    };
    try {
      const response = await this.httpClient.get(`/restaurant/internal/${restaurantId}`, { headers });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get restaurant info ${restaurantId}: ${error.message}`);
      throw new Error('Restaurant not found');
    }
  }
}
