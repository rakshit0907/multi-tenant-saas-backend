import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { DataSource } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { User } from '../users/user.entity';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '../tenant/workspace-member.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private dataSource: DataSource,
  ) {}

  async signup(data: SignupDto) {
    const { name, email, password, tenantName } = data;

    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedTenantName = tenantName?.trim();

    if (
      !normalizedName ||
      !normalizedEmail ||
      !password ||
      !normalizedTenantName
    ) {
      throw new BadRequestException('All fields are required');
    }

    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = randomBytes(32).toString('hex');

    const verificationTokenHash = createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.dataSource.transaction(async (manager) => {
      const tenantRepo = manager.getRepository(Tenant);
      const userRepo = manager.getRepository(User);
      const workspaceMemberRepo = manager.getRepository(WorkspaceMember);

      const tenant = tenantRepo.create({
        name: normalizedTenantName,
      });

      const savedTenant = await tenantRepo.save(tenant);

      const newUser = userRepo.create({
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        tenant: savedTenant,
        isEmailVerified: false,
        emailVerificationToken: verificationTokenHash,
        emailVerificationExpiresAt: verificationExpiresAt,
      });

      const savedUser = await userRepo.save(newUser);

      const workspaceMember = workspaceMemberRepo.create({
        tenant: savedTenant,
        user: savedUser,
        role: WorkspaceRole.OWNER,
      });

      await workspaceMemberRepo.save(workspaceMember);

      return savedUser;
    });

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

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const user = await this.usersService.findByVerificationTokenHash(tokenHash);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Verification token has expired');
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
      throw new BadRequestException('Email and password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user =
      await this.usersService.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }

    const workspace = await this.tenantService.getInitialWorkspace(user.id);

    const payload = {
      userId: user.id,
      tenantId: workspace.id,
      role: user.role,
      workspaceRole: workspace.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: workspace.id,
        role: user.role,
        workspaceRole: workspace.role,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        role: workspace.role,
      },
    };
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user =
      await this.usersService.findByEmailWithVerificationFields(
        normalizedEmail,
      );

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

    const previousToken = user.emailVerificationToken;
    const previousExpiresAt = user.emailVerificationExpiresAt;

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
      user.emailVerificationToken = previousToken;
      user.emailVerificationExpiresAt = previousExpiresAt;

      await this.usersService.save(user);

      console.error('Failed to resend verification email:', error);
    }

    return {
      message:
        'If an unverified account exists, a verification email has been sent',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmailWithPasswordResetFields(
      email.trim().toLowerCase(),
    );

    // Always return same response to prevent email enumeration
    if (!user) {
      return {
        message:
          'If an account exists with that email, a password reset link has been sent.',
      };
    }

    const resetToken = randomBytes(32).toString('hex');

    const resetTokenHash = createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const previousToken = user.passwordResetToken;
    const previousExpiresAt = user.passwordResetExpiresAt;

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.save(user);

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken,
      );
    } catch (error) {
      user.passwordResetToken = previousToken;
      user.passwordResetExpiresAt = previousExpiresAt;

      await this.usersService.save(user);

      console.error('Failed to send password reset email:', error);
    }

    return {
      message:
        'If an account exists with that email, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const user =
      await this.usersService.findByPasswordResetTokenHash(tokenHash);

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;

    await this.usersService.save(user);

    return {
      message: 'Password reset successfully',
    };
  }
}
