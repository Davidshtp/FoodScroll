import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { EmailSender } from '../../application/ports/email-sender.port';
import { CodeType } from '../../domain/value-objects/code-type.vo';

/**
 * Brevo Implementation: EmailSender
 * Implementación concreta del servicio de email usando Brevo API
 */
@Injectable()
export class BrevoEmailAdapter implements EmailSender {
  private readonly logger = new Logger(BrevoEmailAdapter.name);
  private templatesCache: Record<string, string> = {};

  constructor(private readonly config: ConfigService) {}

  private loadTemplate(name: string): string | null {
    if (this.templatesCache[name]) {
      return this.templatesCache[name];
    }

    try {
      const tplPath = path.join(__dirname, 'templates', name);
      const content = fs.readFileSync(tplPath, 'utf8');
      this.templatesCache[name] = content;
      this.logger.log(`Template loaded: ${tplPath}`);
      return content;
    } catch (err: any) {
      this.logger.error(`Could not load template ${name}`, err?.message ?? err);
      return null;
    }
  }

  async sendCode(
    to: string,
    code: string,
    options: { type: CodeType; expiryMinutes: number },
  ): Promise<{ ok: boolean; error?: string }> {
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    const fromEmail = this.config.get<string>('EMAIL_FROM');
    const fromName = this.config.get<string>('EMAIL_FROM_NAME');
    const expiry = options.expiryMinutes ?? 15;
    const type = options.type ?? CodeType.RESET_PASSWORD;

    // Seleccionar template por tipo
    const templateName =
      type === CodeType.CONFIRM_EMAIL ? 'confirm-email.html' : 'reset-code.html';
    const subject =
      type === CodeType.CONFIRM_EMAIL
        ? 'Código de confirmación'
        : 'Código de restablecimiento de contraseña';

    const tpl = this.loadTemplate(templateName);
    const htmlContent = (
      tpl ??
      `<p>Hola,</p><p>Tu código es: <strong>{{code}}</strong></p><p>Válido por {{expiryMinutes}} minutos.</p>`
    )
      .replace(/{{code}}/g, code)
      .replace(/{{expiryMinutes}}/g, String(expiry))
      .replace(/{{email}}/g, to);

    const payload = {
      sender: { email: fromEmail, name: fromName },
      to: [{ email: to }],
      subject,
      htmlContent,
    };

    try {
      const res = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        payload,
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );
      this.logger.log(`Email sent to ${to}`);
      return { ok: true };
    } catch (err: any) {
      this.logger.error('Error sending email', err?.message ?? err);
      return { ok: false, error: err?.message ?? 'send-failed' };
    }
  }
}
