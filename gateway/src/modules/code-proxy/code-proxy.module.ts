import { Module } from '@nestjs/common';
import { CodeProxyController } from './code-proxy.controller';

@Module({
  controllers: [CodeProxyController],
})
export class CodeProxyModule {}
