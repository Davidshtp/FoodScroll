import { Inject, Injectable, Logger } from '@nestjs/common';
import { NATS_CLIENT } from '../nats/nats.provider';
import { NatsConnection, JetStreamClient, JetStreamManager, RetentionPolicy, StorageType } from 'nats';

const APP_STATUS_STREAM = 'APP_STATUS_EVENTS';
const APP_STATUS_SUBJECTS = ['app.status.updated'];

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);

  constructor(@Inject(NATS_CLIENT) private readonly client: { nc: NatsConnection }) {
    this.ensureStream(APP_STATUS_STREAM, APP_STATUS_SUBJECTS).catch((e) => {
      this.logger.error(`Failed to ensure stream ${APP_STATUS_STREAM}`, e);
    });
  }

  private async jsm(): Promise<JetStreamManager> {
    return this.client.nc.jetstreamManager();
  }

  async ensureStream(name: string, subjects: string[]) {
    const jsm = await this.jsm();
    try {
      const info = await jsm.streams.info(name);
      const currentSubjects = info.config.subjects ?? [];
      const missingSubjects = subjects.filter((subject) => !currentSubjects.includes(subject));
      if (missingSubjects.length > 0) {
        await jsm.streams.update(name, {
          ...info.config,
          subjects: [...currentSubjects, ...missingSubjects],
        });
        this.logger.log(`Stream ${name} updated with subjects: ${missingSubjects.join(', ')}`);
        return;
      }
      this.logger.log(`Stream ${name} already exists`);
    } catch (err) {
      this.logger.log(`Creating stream ${name}`);
      await jsm.streams.add({
        name,
        subjects,
        retention: RetentionPolicy.Limits,
        storage: StorageType.File,
        num_replicas: 1,
      });
      this.logger.log(`Stream ${name} created`);
    }
  }
}
