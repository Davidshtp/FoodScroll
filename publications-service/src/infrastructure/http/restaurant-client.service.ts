import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RESTAURANT_SERVICE_URL } from '../config/constants';

interface RestaurantResponse {
  restaurant: {
    id: string;
    userId: string;
    name: string;
  };
}

@Injectable()
export class RestaurantClientService {
  private readonly logger = new Logger('RestaurantClientService');
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(RESTAURANT_SERVICE_URL) || 'http://localhost:5564';
  }

  async getRestaurantByUserId(userId: string, jwt: string): Promise<RestaurantResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/restaurant`, {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'x-service-secret': this.configService.get<string>('SERVICE_SECRET') || '',
            'x-user-id': userId,
          },
        }),
      );
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new HttpException(
          'Restaurant not found for this user. Please create a restaurant profile first.',
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.error(`Failed to get restaurant for user ${userId}: ${error.message}`);
      throw new HttpException(
        'Failed to fetch restaurant information. The restaurant service may be unavailable.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}