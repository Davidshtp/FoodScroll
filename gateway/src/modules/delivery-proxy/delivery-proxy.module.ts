import { Module } from '@nestjs/common';
import { DeliveryProxyController } from './delivery-proxy.controller';

@Module({
  controllers: [DeliveryProxyController],
})
export class DeliveryProxyModule {}