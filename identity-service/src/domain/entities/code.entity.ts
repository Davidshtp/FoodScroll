import { CodeType } from '../value-objects/code-type.vo';
import { CodeStatus } from '../value-objects/code-status.vo';

/**
 * Entity: Code
 * Entidad de dominio pura - Sin decoradores de ORM ni dependencias externas
 * Representa un código de verificación (reset password, confirm email)
 */
export interface CodeProps {
  id: string;
  code: string;
  userId: string;
  type: CodeType;
  status: CodeStatus;
  failedAttempts: number;
  expiresAt: Date;
  createdAt: Date;
}

export class Code {
  readonly id: string;
  readonly code: string;
  readonly userId: string;
  readonly type: CodeType;
  readonly status: CodeStatus;
  readonly failedAttempts: number;
  readonly expiresAt: Date;
  readonly createdAt: Date;

  private static readonly EXPIRY_MINUTES = 15;
  private static readonly MAX_FAILED_ATTEMPTS = 3;

  private constructor(props: CodeProps) {
    this.id = props.id;
    this.code = props.code;
    this.userId = props.userId;
    this.type = props.type;
    this.status = props.status;
    this.failedAttempts = props.failedAttempts;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
  }

  /**
   * Genera un código de 6 dígitos
   */
  private static generate6DigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Factory method para crear un nuevo código
   */
  static create(userId: string, type: CodeType): Code {
    const now = new Date();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return new Code({
      id,
      code: Code.generate6DigitCode(),
      userId,
      type,
      status: CodeStatus.AVAILABLE,
      failedAttempts: 0,
      expiresAt: new Date(now.getTime() + Code.EXPIRY_MINUTES * 60 * 1000),
      createdAt: now,
    });
  }

  /**
   * Reconstituir un código desde la base de datos
   */
  static reconstitute(props: CodeProps): Code {
    return new Code(props);
  }

  /**
   * Verifica si el código ha expirado
   */
  isExpired(now = new Date()): boolean {
    return now > this.expiresAt || this.status === CodeStatus.EXPIRED;
  }

  /**
   * Verifica si el código es válido
   */
  isValid(inputCode: string, now = new Date()): boolean {
    return (
      this.code === inputCode &&
      this.status === CodeStatus.AVAILABLE &&
      !this.isExpired(now) &&
      this.failedAttempts < Code.MAX_FAILED_ATTEMPTS
    );
  }

  /**
   * Verifica si ha excedido los intentos máximos
   */
  hasExceededMaxAttempts(): boolean {
    return this.failedAttempts >= Code.MAX_FAILED_ATTEMPTS;
  }

  /**
   * Marca el código como usado
   */
  markAsUsed(): Code {
    return new Code({
      ...this,
      status: CodeStatus.USED,
    });
  }

  /**
   * Marca el código como expirado
   */
  markAsExpired(): Code {
    return new Code({
      ...this,
      status: CodeStatus.EXPIRED,
    });
  }

  /**
   * Incrementa los intentos fallidos
   */
  incrementFailedAttempts(): Code {
    const newAttempts = this.failedAttempts + 1;
    const newStatus = newAttempts >= Code.MAX_FAILED_ATTEMPTS 
      ? CodeStatus.EXPIRED 
      : this.status;

    return new Code({
      ...this,
      failedAttempts: newAttempts,
      status: newStatus,
    });
  }

  /**
   * Retorna el número de intentos restantes
   */
  getRemainingAttempts(): number {
    return Math.max(0, Code.MAX_FAILED_ATTEMPTS - this.failedAttempts);
  }

  /**
   * Retorna los minutos de expiración configurados
   */
  static getExpiryMinutes(): number {
    return Code.EXPIRY_MINUTES;
  }
}
