import { Module } from '@nestjs/common';
import { EngagementProxyController } from './engagement-proxy.controller';

@Module({
  controllers: [EngagementProxyController],
})
export class EngagementProxyModule {}
