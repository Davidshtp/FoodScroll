import { Provider } from '@nestjs/common';
import { connect, StringCodec, NatsConnection, JetStreamClient } from 'nats';

const NATS_URL = process.env.NATS_URL ?? 'nats://localhost:4222';
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 12;

export const NATS_CLIENT = 'NATS_CLIENT';

async function connectWithRetry(): Promise<{ nc: NatsConnection; js: JetStreamClient }> {
  let attempts = 0;
  while (true) {
    try {
      const nc = await connect({
        servers: [NATS_URL],
        name: 'nats-service',
        maxReconnectAttempts: -1,
      });
      const js = nc.jetstream();
      return { nc, js };
    } catch (err) {
      attempts++;
      if (attempts >= MAX_RETRIES) throw err;
      // wait then retry
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
}

export const natsProvider: Provider = {
  provide: NATS_CLIENT,
  useFactory: async () => {
    const { nc, js } = await connectWithRetry();
    // simple heartbeat logging
    nc.closed().then(() => console.warn('NATS connection closed'));
    return { nc, js, codec: StringCodec() };
  },
};
