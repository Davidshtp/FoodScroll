import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  HEADER_SERVICE_SECRET,
  IDENTITY_SERVICE_URL,
  SERVICE_SECRET,
} from '../config/constants';
import {
  RestaurantIdentityPort,
  UpdateRestaurantStatusInput,
  UpdateRestaurantStatusOutput,
} from '../../application/ports/restaurant-identity.port';

@Injectable()
export class IdentityServiceClient implements RestaurantIdentityPort {
  private readonly logger = new Logger(IdentityServiceClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly serviceSecret: string;
  private readonly baseURL: string;

  constructor(private readonly configService: ConfigService) {
    this.baseURL =
      this.configService.get<string>(IDENTITY_SERVICE_URL) ??
      'http://127.0.0.1:5560';
    this.serviceSecret = this.configService.get<string>(SERVICE_SECRET) ?? '';

    if (!this.serviceSecret) {
      throw new Error(
        'SERVICE_SECRET is not configured for identity-service client',
      );
    }

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
    });
  }

  async updateUserStatus(
    input: UpdateRestaurantStatusInput,
  ): Promise<UpdateRestaurantStatusOutput> {
    const payload: Record<string, unknown> = {};

    if (input.onboardingStatus !== undefined) {
      payload.onboardingStatus = input.onboardingStatus;
    }

    if (input.isActive !== undefined) {
      payload.isActive = input.isActive;
    }

    try {
      const response = await this.httpClient.patch(
        `/users/${input.userId}/onboarding`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: input.authorization,
            [HEADER_SERVICE_SECRET]: this.serviceSecret,
          },
        },
      );

      return {
        access_token: response.data?.accessToken ?? '',
      };
    } catch (error: any) {
      this.logger.error(
        `Error actualizando estado en identity-service: ${error.response?.status ?? error.message} - ${JSON.stringify(error.response?.data)}`,
      );
      return { access_token: '' };
    }
  }
}
