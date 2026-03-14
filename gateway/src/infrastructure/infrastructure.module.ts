import { Global, Module } from '@nestjs/common';
import { HttpClientService } from './http/http-client.service';
import { ServiceAuthService } from './security/service-auth.service';
import { ProxyService } from './http/proxy.service';

@Global()
@Module({
  providers: [HttpClientService, ServiceAuthService, ProxyService],
  exports: [HttpClientService, ServiceAuthService, ProxyService],
})
export class InfrastructureModule {}
