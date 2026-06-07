import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RESTAURANT_SERVICE_URL } from '../config/constants';

interface NearbyRestaurant {
  restaurantId: string;
  name: string;
  logoUrl: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
}

interface NearbyResponse {
  restaurants: NearbyRestaurant[];
}

@Injectable()
export class RestaurantNearbyClient {
  private readonly logger = new Logger('RestaurantNearbyClient');
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(RESTAURANT_SERVICE_URL) || 'http://localhost:5564';
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<NearbyRestaurant[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<NearbyResponse>(`${this.baseUrl}/restaurant/nearby`, {
          params: { latitude, longitude, radius: radiusKm },
          headers: {
            'x-service-secret': this.configService.get<string>('SERVICE_SECRET') || '',
          },
        }),
      );
      return response.data.restaurants;
    } catch (error: any) {
      this.logger.warn(`Failed to fetch nearby restaurants: ${error.message}`);
      return [];
    }
  }
}
