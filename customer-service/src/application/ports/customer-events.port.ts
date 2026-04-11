import { v4 as uuid } from 'uuid';

export enum OnboardingStatus {
  REQUIRED_BASIC_CONFIG = 'REQUIRED_BASIC_CONFIG',
  REQUIRED_ADDRESS = 'REQUIRED_ADDRESS',
  COMPLETED = 'COMPLETED',
}

export interface AppStatusUpdatedEvent {
  eventId: string;
  source?: 'customer-service';
  userId: string;
  updatedAt: string;
  onboardingStatus: string;
  accessToken?: string;
}

export function createAppStatusUpdatedEvent(params: {
  userId: string;
  updatedAt: Date;
  onboardingStatus: string;
  accessToken?: string;
}): AppStatusUpdatedEvent {
  return {
    eventId: uuid(),
    userId: params.userId,
    updatedAt: params.updatedAt.toISOString(),
    onboardingStatus: params.onboardingStatus,
    accessToken: params.accessToken,
  };
}

export interface AppStatusEventsPublisher {
  publishAppStatusUpdated(event: AppStatusUpdatedEvent): Promise<void>;
}

export const APP_STATUS_EVENTS_PUBLISHER = Symbol('AppStatusEventsPublisher');
