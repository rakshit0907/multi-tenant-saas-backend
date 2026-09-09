import { Injectable, BadRequestException, ForbiddenException, } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tenantService: TenantService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signup(data: SignupDto) {
  const { name, email, password, tenantName } = data;

  if (!name || !email || !password || !tenantName) {
    throw new BadRequestException('All fields are required');
  }

  const existingUser = await this.usersService.findByEmail(email);

  if (existingUser) {
    throw new BadRequestException('User already exists');
  }

  const tenant = await this.tenantService.create({
    name: tenantName,
  });

  if (!tenant) {
    throw new BadRequestException('Tenant creation failed');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationToken = randomBytes(32).toString('hex');

  const verificationTokenHash = createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  const verificationExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  );

  const user = await this.usersService.create({
    name,
    email,
    password: hashedPassword,
    tenant,
    isEmailVerified: false,
    emailVerificationToken: verificationTokenHash,
    emailVerificationExpiresAt: verificationExpiresAt,
  });

  if (!user) {
    throw new BadRequestException('User creation failed');
  }

  try {
    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken,
    );
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  return {
    message:
      'User created successfully. Please verify your email before logging in.',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}
 
  async verifyEmail(token: string) {
  if (!token) {
    throw new BadRequestException('Verification token is required');
  }

  const tokenHash = createHash('sha256')
    .update(token)
    .digest('hex');

  const user =
    await this.usersService.findByVerificationTokenHash(tokenHash);

  if (!user) {
    throw new BadRequestException(
      'Invalid verification token',
    );
  }

  if (
    !user.emailVerificationExpiresAt ||
    user.emailVerificationExpiresAt.getTime() < Date.now()
  ) {
    throw new BadRequestException(
      'Verification token has expired',
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpiresAt = null;

  await this.usersService.save(user);

  return {
    message: 'Email verified successfully',
  };
}

  async login(data: LoginDto) {
  const { email, password } = data;

  if (!email || !password) {
    throw new BadRequestException(
      'Email and password are required',
    );
  }

  const user =
    await this.usersService.findByEmailWithPassword(email);

  if (!user) {
    throw new BadRequestException('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password,
  );

  if (!isMatch) {
    throw new BadRequestException('Invalid credentials');
  }

  if (!user.isEmailVerified) {
    throw new ForbiddenException(
      'Please verify your email before logging in',
    );
  }

  const payload = {
    userId: user.id,
    tenantId: user.tenant?.id,
    role: user.role,
  };

  const token = this.jwtService.sign(payload);

  return {
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenant?.id,
      role: user.role,
    },
  };
}

async resendVerification(email: string) {
  const user =
    await this.usersService.findByEmailWithVerificationFields(email);

  // Don't reveal whether an account exists
  if (!user || user.isEmailVerified) {
    return {
      message:
        'If an unverified account exists, a verification email has been sent',
    };
  }

  const verificationToken = randomBytes(32).toString('hex');

  const verificationTokenHash = createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  user.emailVerificationToken = verificationTokenHash;
  user.emailVerificationExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  );

  await this.usersService.save(user);

  try {
    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken,
    );
  } catch (error) {
    console.error('Failed to resend verification email:', error);
  }

  return {
    message:
      'If an unverified account exists, a verification email has been sent',
  };
}

}