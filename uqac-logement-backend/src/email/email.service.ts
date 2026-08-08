import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string | undefined {
    return this.configService.get<string>('RESEND_API_KEY');
  }

  private get fromEmail(): string {
    return (
      this.configService.get<string>('RESEND_FROM_EMAIL') ??
      'UQAC Logement <onboarding@resend.dev>'
    );
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const subject = 'Réinitialisation de ton mot de passe — UQAC Logement';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1f6f5c;">Réinitialisation de mot de passe</h2>
        <p>Tu as demandé à réinitialiser ton mot de passe sur UQAC Logement.</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; background: #1f6f5c; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: bold;">
            Choisir un nouveau mot de passe
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          Ce lien expire dans 1 heure. Si tu n'es pas à l'origine de cette
          demande, tu peux ignorer ce courriel sans risque.
        </p>
      </div>
    `;

    // Sans clé Resend configurée (ex: en développement local), on affiche
    // le lien directement dans les logs du serveur au lieu d'échouer —
    // ça permet de tester tout le flux sans avoir besoin d'un vrai compte
    // d'envoi de courriels tout de suite.
    if (!this.apiKey) {
      this.logger.warn(
        `RESEND_API_KEY non configurée. Lien de réinitialisation pour ${to} :\n${resetLink}`,
      );
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Échec de l'envoi du courriel à ${to} : ${body}`);
      // On ne fait pas planter la requête HTTP pour l'utilisateur si
      // l'envoi échoue — mais on log clairement l'erreur côté serveur.
    }
  }
}
