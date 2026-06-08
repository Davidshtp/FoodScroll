import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios } from 'axios';
import { HEADER_SERVICE_SECRET, SERVICE_SECRET, RESTAURANT_SERVICE_URL } from '../../config/constants';
import { RestaurantInfoPort, RestaurantProfileInfo } from '../../application/ports/restaurant-info.port';

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

  async getRestaurantInfoByUserId(userId: string): Promise<RestaurantProfileInfo> {
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
      'x-user-id': userId,
    };
    try {
      const restaurantRes = await this.httpClient.get('/restaurant', { headers });
      const restaurantId = restaurantRes.data?.restaurant?.id;
      if (!restaurantId) {
        throw new Error('Restaurant ID not found');
      }
      const infoRes = await this.httpClient.get(`/restaurant/internal/${restaurantId}`, { headers });
      const restaurantData = infoRes.data?.restaurant ?? {};
      return {
        id: restaurantData.id ?? restaurantId,
        name: restaurantData.name ?? '',
        phone: restaurantData.phone ?? '',
        email: restaurantData.email ?? '',
        logoUrl: restaurantData.logoUrl ?? '',
      };
    } catch (error) {
      this.logger.error(`Failed to get restaurant info for userId ${userId}: ${error.message}`);
      throw new Error('Restaurant not found');
    }
  }
}
