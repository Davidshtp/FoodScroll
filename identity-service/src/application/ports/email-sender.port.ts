import { CodeType } from '../../domain/value-objects/code-type.vo';

/**
 * Port: EmailSender
 * Define el contrato para el envío de emails
 */
export interface EmailSender {
  sendCode(
    to: string,
    code: string,
    options: { type: CodeType; expiryMinutes: number }
  ): Promise<{ ok: boolean; error?: string }>;
}

export const EMAIL_SENDER = Symbol('EmailSender');
