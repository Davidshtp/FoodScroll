import { Module } from '@nestjs/common';
import { PublicationsProxyController } from './publications-proxy.controller';

@Module({
  controllers: [PublicationsProxyController],
})
export class PublicationsProxyModule {}
