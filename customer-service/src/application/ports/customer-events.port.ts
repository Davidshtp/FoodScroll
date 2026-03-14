import { v4 as uuid } from 'uuid';

export interface AppStatusUpdatedEvent {
  eventId: string;
  source?: 'customer-service';
  userId: string;
  updatedAt: string;
  onboardingStatus: string;
}

export function createAppStatusUpdatedEvent(params: {
  userId: string;
  updatedAt: Date;
  onboardingStatus: string;
}): AppStatusUpdatedEvent {
  return {
    eventId: uuid(),
    userId: params.userId,
    updatedAt: params.updatedAt.toISOString(),
    onboardingStatus: params.onboardingStatus,
  };
}

export interface AppStatusEventsPublisher {
  publishAppStatusUpdated(event: AppStatusUpdatedEvent): Promise<void>;
}

export const APP_STATUS_EVENTS_PUBLISHER = Symbol('AppStatusEventsPublisher');
