import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios } from 'axios';
import { HEADER_SERVICE_SECRET, SERVICE_SECRET, PUBLICATIONS_SERVICE_URL } from '../config/constants';
import { PublicationPort, PublicationData } from '../../application/ports/publication.port';

@Injectable()
export class PublicationServiceClient implements PublicationPort {
  private readonly logger = new Logger(PublicationServiceClient.name);
  private readonly httpClient: Axios;
  private readonly serviceSecret: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>(PUBLICATIONS_SERVICE_URL) ?? 'http://127.0.0.1:5565';
    const secret = this.configService.get<string>(SERVICE_SECRET);
    if (!secret) {
      throw new Error('SERVICE_SECRET not configured');
    }
    this.serviceSecret = secret;
    this.httpClient = axios.create({ baseURL, timeout: 5000 });
  }

  async getPublicationById(publicationId: string, authorization: string): Promise<PublicationData> {
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
      Authorization: authorization,
    };
    try {
      const response = await this.httpClient.get(`/publications/${publicationId}`, { headers });
      const pub = response.data;
      return {
        id: pub.id ?? pub._id,
        title: pub.title,
        price: pub.price,
        restaurantId: pub.restaurantId,
      };
    } catch (error) {
      this.logger.error(`Failed to get publication ${publicationId}: ${error.message}`);
      throw new Error(`Publication ${publicationId} not found`);
    }
  }
}
