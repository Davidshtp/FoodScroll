import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { HEADER_SERVICE_SECRET, IDENTITY_SERVICE_URL, SERVICE_SECRET } from '../config/constants';
import { CustomerIdentityPort, UpdateOnboardingInput, UpdateOnboardingOutput } from '../../application/ports/customer-identity.port';

@Injectable()
export class IdentityServiceClient implements CustomerIdentityPort {
  private readonly logger = new Logger(IdentityServiceClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly serviceSecret: string;
  private readonly baseURL: string;

  constructor(private readonly configService: ConfigService) {
    this.baseURL = this.configService.get<string>(IDENTITY_SERVICE_URL) ?? 'http://127.0.0.1:5560';
    this.serviceSecret = this.configService.get<string>(SERVICE_SECRET) ?? '';

    if (!this.serviceSecret) {
      throw new Error('SERVICE_SECRET is not configured for identity-service client');
    }

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
    });
  }

  async updateOnboarding(input: UpdateOnboardingInput): Promise<UpdateOnboardingOutput> {
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
      Authorization: input.authorization,
    };

    const response = await this.httpClient.patch(`/users/${input.userId}/onboarding`, {
      onboardingStatus: input.onboardingStatus,
    }, { headers });

    this.logger.log(
      `onboarding actualizado: userId=${input.userId}, status=${input.onboardingStatus}`,
    );

    return {
      access_token: response.data.accessToken,
    };
  }
}