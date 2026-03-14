import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SeedLocationsUseCase } from '../../application/usecases/seed/seed-locations.usecase';

@Injectable()
export class SeedRunner implements OnModuleInit {
  private readonly logger = new Logger(SeedRunner.name);

  constructor(private readonly seedLocationsUseCase: SeedLocationsUseCase) {}

  async onModuleInit() {
    try {
      await this.seedLocationsUseCase.execute();
    } catch (error) {
      this.logger.error('Error durante el seeding:', error);
    }
  }
}
