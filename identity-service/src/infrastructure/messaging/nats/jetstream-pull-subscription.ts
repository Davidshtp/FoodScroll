import { Logger } from '@nestjs/common';
import { AckPolicy, connect, JetStreamClient, JetStreamPullSubscription, JsMsg, NatsConnection } from 'nats';

export interface JetStreamPullSubscriptionOptions {
  natsUrl: string;
  stream: string;
  subject: string;
  durable: string;
  batch?: number;
  expiresMs?: number;
  pullIntervalMs?: number;
  loggerContext?: string;
}

export class NatsJetStreamPullSubscriber {
  private readonly logger: Logger;
  private readonly batch: number;
  private readonly expiresMs: number;
  private readonly pullIntervalMs: number;

  private nc: NatsConnection | null = null;
  private js: JetStreamClient | null = null;
  private sub: JetStreamPullSubscription | null = null;
  private pullInterval: NodeJS.Timeout | null = null;

  constructor(private readonly options: JetStreamPullSubscriptionOptions) {
    this.logger = new Logger(options.loggerContext ?? NatsJetStreamPullSubscriber.name);
    this.batch = options.batch ?? 10;
    this.expiresMs = options.expiresMs ?? 1000;
    this.pullIntervalMs = options.pullIntervalMs ?? 500;
  }

  async start(onMessage: (msg: JsMsg) => Promise<void>): Promise<void> {
    if (this.sub) {
      return;
    }

    this.nc = await connect({ servers: [this.options.natsUrl] });
    this.js = this.nc.jetstream();

    this.nc.closed().then(() => {
      this.logger.warn('Conexion NATS cerrada');
    });

    this.sub = await this.js.pullSubscribe(this.options.subject, {
      stream: this.options.stream,
      config: {
        durable_name: this.options.durable,
        ack_policy: AckPolicy.Explicit,
      },
    });

    this.pullInterval = setInterval(() => {
      this.sub?.pull({ batch: this.batch, expires: this.expiresMs });
    }, this.pullIntervalMs);

    this.sub.pull({ batch: this.batch, expires: this.expiresMs });

    void (async () => {
      if (!this.sub) {
        return;
      }

      for await (const msg of this.sub) {
        try {
          await onMessage(msg);
        } catch (error) {
          this.logger.error(`Error procesando mensaje ${this.options.subject}: ${String(error)}`);
        }
      }
    })();
  }

  async stop(): Promise<void> {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }

    this.sub = null;

    if (!this.nc) {
      return;
    }

    await this.nc.close();
    this.nc = null;
    this.js = null;
  }
}
