import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios } from 'axios';
import { HEADER_SERVICE_SECRET, SERVICE_SECRET, RESTAURANT_SERVICE_URL } from '../config/constants';
import { RestaurantPort } from '../../application/ports/restaurant.port';

@Injectable()
export class RestaurantServiceClient implements RestaurantPort {
  private readonly logger = new Logger(RestaurantServiceClient.name);
  private readonly httpClient: Axios;
  private readonly serviceSecret: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>(RESTAURANT_SERVICE_URL) ?? 'http://127.0.0.1:5563';
    const secret = this.configService.get<string>(SERVICE_SECRET);
    if (!secret) {
      throw new Error('SERVICE_SECRET not configured');
    }
    this.serviceSecret = secret;
    this.httpClient = axios.create({ baseURL, timeout: 5000 });
  }

  async validateRestaurantExists(restaurantId: string, authorization: string): Promise<void> {
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
      Authorization: authorization,
    };
    try {
      await this.httpClient.get(`/restaurant/${restaurantId}`, { headers });
    } catch (error) {
      this.logger.error(`Failed to validate restaurant ${restaurantId}: ${error.message}`);
      throw new Error('Invalid restaurant');
    }
  }

  async getRestaurantByUserId(userId: string, authorization: string): Promise<string> {
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
      'x-user-id': userId,
      Authorization: authorization,
    };
    try {
      const response = await this.httpClient.get('/restaurant', { headers });
      return response.data.restaurant.id;
    } catch (error) {
      this.logger.error(`Failed to get restaurant for user ${userId}: ${error.message}`);
      throw new Error('Restaurant not found for this user');
    }
  }
}
