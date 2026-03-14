import { Module, Global } from '@nestjs/common';
import { natsProvider } from './nats.provider';

@Global()
@Module({
  providers: [natsProvider],
  exports: [natsProvider],
})
export class NatsModule {}
