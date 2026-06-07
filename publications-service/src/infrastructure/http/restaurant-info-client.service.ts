import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RESTAURANT_SERVICE_URL } from '../config/constants';

interface RestaurantInfoResponse {
  restaurant: {
    id: string;
    name: string;
    phone: string;
    email: string;
    logoUrl: string;
  };
  address: {
    id: string;
    address: string;
    cityId: string;
    latitude: number;
    longitude: number;
  } | null;
}

interface RestaurantUserMapping {
  id: string;
  userId: string;
  name: string;
  logoUrl: string;
}

@Injectable()
export class RestaurantInfoClient {
  private readonly logger = new Logger('RestaurantInfoClient');
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(RESTAURANT_SERVICE_URL) || 'http://localhost:5564';
  }

  async findByUserIds(userIds: string[]): Promise<RestaurantUserMapping[]> {
    if (userIds.length === 0) return [];
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ restaurants: RestaurantUserMapping[] }>(
          `${this.baseUrl}/restaurant/internal/by-user-ids`,
          {
            params: { ids: userIds.join(',') },
            headers: {
              'x-service-secret': this.configService.get<string>('SERVICE_SECRET') || '',
            },
          },
        ),
      );
      return response.data.restaurants;
    } catch (error: any) {
      this.logger.warn(`Failed to fetch restaurants by user ids: ${error.message}`);
      return [];
    }
  }

  async getAddressesByRestaurantIds(ids: string[]): Promise<Map<string, { latitude: number; longitude: number; cityId: string }>> {
    if (ids.length === 0) return new Map();
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ addresses: { restaurantId: string; latitude: number; longitude: number; cityId: string }[] }>(
          `${this.baseUrl}/restaurant/internal/addresses`,
          {
            params: { ids: ids.join(',') },
            headers: {
              'x-service-secret': this.configService.get<string>('SERVICE_SECRET') || '',
            },
          },
        ),
      );
      return new Map(response.data.addresses.map(a => [a.restaurantId, { latitude: a.latitude, longitude: a.longitude, cityId: a.cityId }]));
    } catch (error: any) {
      this.logger.warn(`Failed to fetch addresses: ${error.message}`);
      return new Map();
    }
  }

  async getRestaurantInfo(restaurantId: string): Promise<RestaurantInfoResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/restaurant/internal/${restaurantId}`, {
          headers: {
            'x-service-secret': this.configService.get<string>('SERVICE_SECRET') || '',
          },
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.warn(`Failed to get restaurant info for ${restaurantId}: ${error.message}`);
      return {
        restaurant: { id: restaurantId, name: 'Unknown', phone: '', email: '', logoUrl: '' },
        address: null,
      };
    }
  }
}
