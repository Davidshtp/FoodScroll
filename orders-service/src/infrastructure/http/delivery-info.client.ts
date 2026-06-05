import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios } from 'axios';
import { HEADER_SERVICE_SECRET, SERVICE_SECRET, DELIVERY_SERVICE_URL } from '../config/constants';
import { DeliveryInfoPort, DeliveryInfo } from '../../application/ports/delivery-info.port';

@Injectable()
export class DeliveryInfoClient implements DeliveryInfoPort {
  private readonly logger = new Logger(DeliveryInfoClient.name);
  private readonly httpClient: Axios;
  private readonly serviceSecret: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>(DELIVERY_SERVICE_URL) ?? 'http://127.0.0.1:5563';
    const secret = this.configService.get<string>(SERVICE_SECRET);
    if (!secret) {
      throw new Error('SERVICE_SECRET not configured');
    }
    this.serviceSecret = secret;
    this.httpClient = axios.create({ baseURL, timeout: 5000 });
  }

  async getDeliveryInfo(userId: string): Promise<DeliveryInfo> {
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
    };
    try {
      const response = await this.httpClient.get(`/delivery-profile/internal/${userId}`, { headers });
      return response.data.profile;
    } catch (error) {
      this.logger.error(`Failed to get delivery info ${userId}: ${error.message}`);
      throw new Error('Delivery profile not found');
    }
  }
}
