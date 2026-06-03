import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios } from 'axios';
import { HEADER_SERVICE_SECRET, SERVICE_SECRET, CUSTOMER_SERVICE_URL } from '../config/constants';
import { CustomerInfoPort } from '../../application/ports/customer-info.port';

@Injectable()
export class CustomerInfoClient implements CustomerInfoPort {
  private readonly logger = new Logger(CustomerInfoClient.name);
  private readonly httpClient: Axios;
  private readonly serviceSecret: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>(CUSTOMER_SERVICE_URL) ?? 'http://127.0.0.1:5561';
    const secret = this.configService.get<string>(SERVICE_SECRET);
    if (!secret) {
      throw new Error('SERVICE_SECRET not configured');
    }
    this.serviceSecret = secret;
    this.httpClient = axios.create({ baseURL, timeout: 5000 });
  }

  async getCustomerInfo(userId: string) {
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
    };
    try {
      const response = await this.httpClient.get(`/customer-profile/internal/${userId}`, { headers });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get customer info ${userId}: ${error.message}`);
      throw new Error('Customer not found');
    }
  }
}
