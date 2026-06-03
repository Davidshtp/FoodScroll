import { ForbiddenException, ConflictException } from '@nestjs/common';

export class OrderNotFoundError extends ConflictException {
  constructor(orderId: string) {
    super(`Order with id ${orderId} not found`);
  }
}

export class UnauthorizedOrderAccessError extends ForbiddenException {
  constructor(orderId: string) {
    super(`Unauthorized access to order ${orderId}`);
  }
}

export class ForbiddenRoleError extends ForbiddenException {
  constructor(role: string, action: string) {
    super(`Role ${role} is not authorized to ${action}`);
  }
}

export class OrderCannotBeCancelledError extends ConflictException {
  constructor(status: string) {
    super(`Order cannot be cancelled in status ${status}`);
  }
}

export class OrderNotAvailableForDeliveryError extends ConflictException {
  constructor(status: string) {
    super(`Order is not available for delivery: current status is ${status}`);
  }
}

export class OrderAlreadyAssignedError extends ConflictException {
  constructor(orderId: string) {
    super(`Order ${orderId} has already been assigned to a delivery person`);
  }
}

export class OrderNotAssignedToYouError extends ForbiddenException {
  constructor(orderId: string) {
    super(`Order ${orderId} was not assigned to you`);
  }
}

export class OrderNotAcceptedError extends ConflictException {
  constructor(status: string) {
    super(`Order has not been accepted yet: current status is ${status}`);
  }
}

export class OrderNotOutForDeliveryError extends ConflictException {
  constructor(status: string) {
    super(`Order is not currently out for delivery: current status is ${status}`);
  }
}

export class InvalidOrderStatusTransitionError extends ConflictException {
  constructor(currentStatus: string, targetStatus: string) {
    super(`Cannot transition from ${currentStatus} to ${targetStatus}`);
  }
}

// ───── Cart Errors ─────

export class CartNotFoundError extends ConflictException {
  constructor(customerId: string) {
    super(`Cart not found for customer ${customerId}`);
  }
}

export class CartItemNotFoundError extends ConflictException {
  constructor(cartItemId: string) {
    super(`Cart item ${cartItemId} not found`);
  }
}

export class CartEmptyError extends ConflictException {
  constructor() {
    super('Cannot checkout an empty cart');
  }
}

export class InvalidQuantityError extends ConflictException {
  constructor(quantity: number) {
    super(`Invalid quantity: ${quantity}. Minimum is 1`);
  }
}

export class PublicationNotFoundError extends ConflictException {
  constructor(publicationId: string) {
    super(`Publication ${publicationId} not found`);
  }
}
