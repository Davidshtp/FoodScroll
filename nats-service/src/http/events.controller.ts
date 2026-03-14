import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { EventEmitterService } from '../event-emitter/event-emitter.service';

interface AppStatusUpdatedEventDto {
  eventId: string;
  source?: string;
  userId: string;
  updatedAt: string;
  onboardingStatus: string;
}

@Controller('events')
export class EventsController {
  constructor(private readonly eventEmitterService: EventEmitterService) {}

  @Post('app-status-updated')
  async publishAppStatusUpdated(@Body() body: AppStatusUpdatedEventDto) {

    if (!body?.eventId || !body?.userId || !body?.updatedAt || !body?.onboardingStatus) {
      throw new BadRequestException('eventId, userId, updatedAt y onboardingStatus son requeridos');
    }

    const payload: AppStatusUpdatedEventDto = {
      ...body,
      source: body.source ?? 'customer-service',
    };

    await this.eventEmitterService.emitEvent('app.status.updated', payload);

    return {
      ok: true,
      eventId: payload.eventId,
      userId: payload.userId,
      subject: 'app.status.updated',
    };
  }
}
