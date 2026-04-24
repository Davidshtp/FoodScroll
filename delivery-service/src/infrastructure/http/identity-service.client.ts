import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  HEADER_SERVICE_SECRET,
  IDENTITY_SERVICE_URL,
  SERVICE_SECRET,
} from '../../config/constants';
import {
  DeliveryIdentityPort,
  UpdateUserStatusInput,
  UpdateUserStatusOutput,
} from '../../application/ports/delivery-identity.port';

@Injectable()
export class IdentityServiceClient implements DeliveryIdentityPort {
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
    input: UpdateUserStatusInput,
  ): Promise<UpdateUserStatusOutput> {
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
      Authorization: input.authorization,
    };

    const body: Record<string, any> = {};
    if (input.onboardingStatus) {
      body.onboardingStatus = input.onboardingStatus;
    }
    if (input.isActive !== undefined) {
      body.isActive = input.isActive;
    }

    const response = await this.httpClient.patch(
      `/users/${input.userId}/onboarding`,
      body,
      { headers },
    );

    if (
      response.status < 200 ||
      response.status >= 300 ||
      !response.data?.accessToken
    ) {
      throw new Error(
        `Failed to update user status for userId=${input.userId}`,
      );
    }

    this.logger.log(
      `user status actualizado: userId=${input.userId}, onboardingStatus=${input.onboardingStatus}, isActive=${input.isActive}`,
    );

    return {
      access_token: response.data.accessToken,
    };
  }
}
