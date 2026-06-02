export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class LikeNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(identifier ? `Like not found for "${identifier}"` : 'Like not found');
  }
}

export class FollowerNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(identifier ? `Follower relation not found for "${identifier}"` : 'Follower relation not found');
  }
}

export class CannotFollowSelfError extends DomainError {
  constructor() {
    super('No puedes seguirte a ti mismo');
  }
}

export class CommentNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(identifier ? `Comment "${identifier}" not found` : 'Comment not found');
  }
}

export class CommentOwnershipError extends DomainError {
  constructor() {
    super('No tienes permiso para eliminar este comentario');
  }
}

export class InvalidCommentDataError extends DomainError {
  constructor(message: string) {
    super(`Invalid comment data: ${message}`);
  }
}

export class RoleNotAllowedError extends DomainError {
  constructor(action: string) {
    super(`Tu rol no tiene permiso para realizar: ${action}`);
  }
}
