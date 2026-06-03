import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios } from 'axios';
import { HEADER_SERVICE_SECRET, SERVICE_SECRET, IDENTITY_SERVICE_URL } from '../config/constants';
import { CustomerIdentityPort } from '../../application/ports/customer-identity.port';

@Injectable()
export class IdentityServiceClient implements CustomerIdentityPort {
  private readonly logger = new Logger(IdentityServiceClient.name);
  private readonly httpClient: Axios;
  private readonly serviceSecret: string;
  private readonly baseURL: string;

  constructor(private readonly configService: ConfigService) {
    this.baseURL = this.configService.get<string>(IDENTITY_SERVICE_URL) ?? 'http://127.0.0.1:5560';
    const secret = this.configService.get<string>(SERVICE_SECRET);
    if (!secret) {
      throw new Error('SERVICE_SECRET not configured');
    }
    this.serviceSecret = secret;

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
    });
  }

  async validateUserId(userId: string, authorization: string): Promise<void> {
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
      Authorization: authorization,
    };

    try {
      await this.httpClient.get(`/users/${userId}`, { headers });
    } catch (error) {
      this.logger.error(`Failed to validate user ${userId}: ${error.message}`);
      throw new Error('Invalid user');
    }
  }
}
