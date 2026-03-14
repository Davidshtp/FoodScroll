import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsMsg, StringCodec } from 'nats';
import { SyncUserAppStatusUseCase } from '../../../application/usecases/events/sync-user-app-status.usecase';
import { NATS_URL } from '../../config/constants';
import { NatsJetStreamPullSubscriber } from './jetstream-pull-subscription';

interface AppStatusUpdatedEvent {
  eventId: string;
  source: string;
  userId: string;
  updatedAt: string;
  onboardingStatus: string;
}

const SUBJECT = 'app.status.updated';
const STREAM = 'APP_STATUS_EVENTS';
const DURABLE = 'identity-app-status-updated';

@Injectable()
export class AppStatusUpdatedConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppStatusUpdatedConsumer.name);
  private readonly codec = StringCodec();
  private subscription: NatsJetStreamPullSubscriber | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly syncUserAppStatusUseCase: SyncUserAppStatusUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    const natsUrl = this.configService.get<string>(NATS_URL) ?? 'nats://localhost:4222';
    this.subscription = new NatsJetStreamPullSubscriber({
      natsUrl,
      stream: STREAM,
      subject: SUBJECT,
      durable: DURABLE,
      loggerContext: AppStatusUpdatedConsumer.name,
    });

    await this.subscription.start((msg) => this.handleMessage(msg));

    this.logger.log('Consumer durable identity-app-status-updated suscrito a app.status.updated');
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.subscription) {
      return;
    }

    await this.subscription.stop();
    this.subscription = null;
  }

  private async handleMessage(msg: JsMsg): Promise<void> {
    const event = JSON.parse(this.codec.decode(msg.data)) as AppStatusUpdatedEvent;

    this.logger.log(
      `Evento recibido subject=${msg.subject} eventId=${event.eventId} source=${event.source} userId=${event.userId}`,
    );

    await this.syncUserAppStatusUseCase.execute({
      userId: event.userId,
      onboardingStatus: event.onboardingStatus,
      updatedAt: event.updatedAt,
    });

    msg.ack();
    this.logger.log(
      `Evento app.status.updated procesado para userId=${event.userId}, eventId=${event.eventId}, source=${event.source}, onboardingStatus=${event.onboardingStatus}, updatedAt=${event.updatedAt}`,
    );
  }
}
