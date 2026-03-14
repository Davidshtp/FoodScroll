import { Role } from '../value-objects/role.vo';

/**
 * Entity: User
 * Entidad de dominio pura - Sin decoradores de ORM ni dependencias externas
 * Representa un usuario del sistema con su lógica de negocio
 */
export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  hashedRefreshToken: string | null;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  appStatus: string | null;
}

export class User {
  readonly id: string;
  readonly email: string;
  private readonly _passwordHash: string;
  readonly role: Role;
  readonly isActive: boolean;
  readonly isVerified: boolean;
  readonly hashedRefreshToken: string | null;
  readonly tokenVersion: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly appStatus: string | null;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this._passwordHash = props.passwordHash;
    this.role = props.role;
    this.isActive = props.isActive;
    this.isVerified = props.isVerified;
    this.hashedRefreshToken = props.hashedRefreshToken;
    this.tokenVersion = props.tokenVersion;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt ?? null;
    this.appStatus = props.appStatus ?? null;
  }

  /**
   * Factory method para crear un nuevo usuario
   */
  static create(props: {
    id: string;
    email: string;
    passwordHash: string;
    role: Role;
  }): User {
    return new User({
      ...props,
      isActive: true,
      isVerified: false,
      hashedRefreshToken: null,
      tokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      appStatus: 'REQUIRED_BASIC_CONFIG',
    });
  }

  /**
   * Reconstituir un usuario desde la base de datos
   */
  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  getPasswordHash(): string {
    return this._passwordHash;
  }

  /**
   * Verifica el email del usuario
   */
  verifyEmail(): User {
    return new User({
      id: this.id,
      email: this.email,
      passwordHash: this._passwordHash,
      role: this.role,
      isActive: this.isActive,
      isVerified: true,
      hashedRefreshToken: this.hashedRefreshToken,
      tokenVersion: this.tokenVersion,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
      appStatus: this.appStatus,
    });
  }

  /**
   * Actualiza la contraseña del usuario
   */
  updatePassword(newPasswordHash: string): User {
    return new User({
      id: this.id,
      email: this.email,
      passwordHash: newPasswordHash,
      role: this.role,
      isActive: this.isActive,
      isVerified: this.isVerified,
      hashedRefreshToken: null, // Invalidar refresh token al cambiar contraseña
      tokenVersion: this.tokenVersion + 1, // Incrementar versión para invalidar tokens
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
      appStatus: this.appStatus,
    });
  }

  /**
   * Guarda el refresh token hasheado
   */
  setRefreshToken(hashedToken: string): User {
    return new User({
      id: this.id,
      email: this.email,
      passwordHash: this._passwordHash,
      role: this.role,
      isActive: this.isActive,
      isVerified: this.isVerified,
      hashedRefreshToken: hashedToken,
      tokenVersion: this.tokenVersion,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
      appStatus: this.appStatus,
    });
  }

  /**
   * Revoca todas las sesiones del usuario
   */
  revokeSessions(): User {
    return new User({
      id: this.id,
      email: this.email,
      passwordHash: this._passwordHash,
      role: this.role,
      isActive: this.isActive,
      isVerified: this.isVerified,
      hashedRefreshToken: null,
      tokenVersion: this.tokenVersion + 1,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
      appStatus: this.appStatus,
    });
  }

  setAppStatus(appStatus: string, updatedAt: Date): User {
    if (this.appStatus === appStatus && this.updatedAt.getTime() === updatedAt.getTime()) {
      return this;
    }

    return new User({
      id: this.id,
      email: this.email,
      passwordHash: this._passwordHash,
      role: this.role,
      isActive: this.isActive,
      isVerified: this.isVerified,
      hashedRefreshToken: this.hashedRefreshToken,
      tokenVersion: this.tokenVersion,
      createdAt: this.createdAt,
      updatedAt,
      deletedAt: this.deletedAt,
      appStatus,
    });
  }

  /**
   * Desactiva el usuario
   */
  deactivate(): User {
    return new User({
      id: this.id,
      email: this.email,
      passwordHash: this._passwordHash,
      role: this.role,
      isActive: false,
      isVerified: this.isVerified,
      hashedRefreshToken: null,
      tokenVersion: this.tokenVersion + 1,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
      appStatus: this.appStatus,
    });
  }

  /**
   * Retorna una representación pública del usuario (sin datos sensibles)
   */
  toPublic() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      isActive: this.isActive,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      appStatus: this.appStatus,
    };
  }
}
