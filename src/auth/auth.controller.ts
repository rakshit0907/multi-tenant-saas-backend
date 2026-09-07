import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
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

}