import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AppStatusEventsPublisher, AppStatusUpdatedEvent } from '../../../application/ports/customer-events.port';
import { HEADER_SERVICE_SECRET, NATS_SERVICE_URL, SERVICE_SECRET } from '../../config/constants';

@Injectable()
export class NatsServiceEventsPublisher implements AppStatusEventsPublisher {
  private readonly logger = new Logger(NatsServiceEventsPublisher.name);
  private readonly httpClient: AxiosInstance;
  private readonly serviceSecret: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>(NATS_SERVICE_URL) ?? 'http://localhost:5590';
    this.serviceSecret = this.configService.get<string>(SERVICE_SECRET) ?? '';

    if (!this.serviceSecret) {
      throw new Error('SERVICE_SECRET is not configured for nats-service publishing');
    }

    this.httpClient = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async publishAppStatusUpdated(event: AppStatusUpdatedEvent): Promise<void> {
    const payload: AppStatusUpdatedEvent = {
      ...event,
      source: 'customer-service',
    };

    await this.httpClient.post('/events/app-status-updated', payload, {
      headers: {
        [HEADER_SERVICE_SECRET]: this.serviceSecret,
      },
    });
    this.logger.log(
      `app.status.updated enviado a nats-service eventId=${payload.eventId} userId=${payload.userId} onboardingStatus=${payload.onboardingStatus} updatedAt=${payload.updatedAt}`,
    );
  }
}
