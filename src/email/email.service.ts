import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private readonly resend: Resend;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not configured');
        }

        this.resend = new Resend(apiKey);

    }

    async sendVerificationEmail(
        email: string,
        name: string,
        verificationToken: string,
    ): Promise<void> {
        const from = this.configService.get<string>('EMAIL_FROM');

        if  (!from) {
            throw new Error('EMAIL_FROM is not configured');
        }

        const frontendUrl =
          this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

        const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;  

        const { error } = await this.resend.emails.send({
            from,
            to: email,
            subject: 'Verify your email',
            html: `
               <h2>Welcome, ${name}</h2>
               <p>Please verify your email address to activate your account.</p>
               <p>
                 <a href="${verificationUrl}">Verify Email</a>
                 </p>
                 <p>This verification link expires in 24 hours.</p>
                 `,
        });

        if (error) {
            throw new InternalServerErrorException(
                'Failed to send verification email',
            );
        }
    }
}