import { Injectable, BadRequestException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

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

    // 👤 Create user with tenant relation
    const user = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
      tenant,
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async login(data: LoginDto) {
  const { email, password } = data;

  console.log('================ LOGIN START ================');
  console.log('EMAIL RECEIVED:', email);
  console.log('PASSWORD RECEIVED:', password);

  if (!email || !password) {
    console.log('❌ Missing email or password');
    throw new BadRequestException('Email and password are required');
  }

  const user = await this.usersService.findByEmail(email);

  console.log('USER FOUND:', user);

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

  console.log('JWT PAYLOAD:', payload);

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