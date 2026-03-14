import { Inject, Injectable, Logger } from '@nestjs/common';
import { NATS_CLIENT } from '../nats/nats.provider';
import { Codec, JetStreamClient } from 'nats';

@Injectable()
export class EventEmitterService {
  private readonly logger = new Logger(EventEmitterService.name);

  constructor(@Inject(NATS_CLIENT) private readonly client: { js: JetStreamClient; codec: Codec<string> }) {}

  async emitEvent(subject: string, data: unknown): Promise<void> {
    try {
      const sc = this.client.codec;
      const payload = sc.encode(JSON.stringify(data));
      const pa = await this.client.js.publish(subject, payload);
      this.logger.log(`Published ${subject} seq=${pa.seq}`);
    } catch (err) {
      this.logger.error('Failed to publish event', err);
      throw err;
    }
  }
}
