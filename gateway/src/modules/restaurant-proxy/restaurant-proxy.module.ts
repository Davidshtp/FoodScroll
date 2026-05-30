import { Module } from '@nestjs/common';
import { RestaurantProxyController } from './restaurant-proxy.controller';

@Module({
  controllers: [RestaurantProxyController],
})
export class RestaurantProxyModule {}
