import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() data: SignupDto) {
    return this.authService.signup(data);
  }
  @Post('login')
login(@Body() data: LoginDto) {
  return this.authService.login(data);
}

@Post('verify-email')
verifyEmail(@Body() data: VerifyEmailDto) {
  return this.authService.verifyEmail(data.token);
}

@Post('resend-verification')
resendVerification(@Body() data: ResendVerificationDto) {
  return this.authService.resendVerification(data.email);
}

@Get('verify-email-link')
async verifyEmailLink(@Query('token') token: string) {
  await this.authService.verifyEmail(token);

  return `
    <html>
      <head>
        <title>Email Verified</title>
      </head>
      <body style="
        font-family: Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
      ">
        <div style="text-align:center;">
          <h2>Email verified successfully ✅</h2>
          <p>You can now return to the app and log in.</p>
        </div>
      </body>
    </html>
  `;
}
}