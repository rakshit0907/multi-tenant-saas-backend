import { Injectable, BadRequestException, } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tenantService: TenantService,
    private jwtService: JwtService,
  ) {}

  async signup(data: SignupDto) {
    const { name, email, password, tenantName } = data;

    // 🔴 Hard validation (you didn’t have this)
    if (!name || !email || !password || !tenantName) {
      throw new BadRequestException('All fields are required');
    }

    // 🔍 Check existing user
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // ✅ FIX: ensure tenant gets proper data (NOT undefined)
    const tenant = await this.tenantService.create({
      name: tenantName,
    });

    if (!tenant) {
      throw new BadRequestException('Tenant creation failed');
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString('hex');

    const verificationTokenHash = createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const verificationExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    // 👤 Create user with tenant relation
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

    // 🎟️ JWT payload
    const payload = {
      userId: user.id,
      tenantId: tenant.id,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'User created successfully',
      token,
      verificationToken,
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

  console.log('================ LOGIN START ================');
  console.log('EMAIL RECEIVED:', email);

  if (!email || !password) {
    console.log('❌ Missing email or password');
    throw new BadRequestException('Email and password are required');
  }

  const user = await this.usersService.findByEmailWithPassword(email);


  if (!user) {
    console.log('❌ USER NOT FOUND');
    throw new BadRequestException('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  console.log('PASSWORD MATCH:', isMatch);

  if (!isMatch) {
    console.log('❌ PASSWORD INCORRECT');
    throw new BadRequestException('Invalid credentials');
  }

  const payload = {
    userId: user.id,
    tenantId: user.tenant?.id,
    role: user.role,
  };


  const token = this.jwtService.sign(payload);

  console.log('✅ LOGIN SUCCESS');
  console.log('================ LOGIN END =================');

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
}