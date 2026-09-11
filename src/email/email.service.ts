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

        const verificationUrl =
          `http://localhost:3000/auth/verify-email-link?token=${encodeURIComponent(verificationToken)}`;  

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

    async sendPasswordResetEmail(
      email: string,
      name: string,
      resetToken: string,
    ): Promise<void> {
     const resetUrl =
      `http://localhost:3000/auth/reset-password-link?token=${encodeURIComponent(resetToken)}`;

     const { error } = await this.resend.emails.send({
       from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
       to: email,
       subject: 'Reset your password',
       html: `
         <h2>Password Reset Request</h2>
         <p>Hi ${name},</p>
         <p>You requested to reset your password.</p>
         <p>This link will expire in 15 minutes.</p>
         <a href="${resetUrl}">
           Reset Password
         </a>
         <p>If you did not request this, you can ignore this email.</p>
       `,
     });

     if (error) {
      throw new Error(
        `Failed to send password reset email: ${error.message}`,
      );
    }
  }
}