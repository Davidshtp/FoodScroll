import { Module } from '@nestjs/common';
import { LocationProxyController } from './location-proxy.controller';

@Module({
  controllers: [LocationProxyController],
})
export class LocationProxyModule {}
