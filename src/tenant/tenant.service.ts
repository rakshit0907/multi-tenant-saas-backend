import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Tenant } from './tenant.entity';
import { OrganizationInvite } from './organization-invite.entity';
import { User } from '../users/user.entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Role } from '../common/enums/role.enum';
import { WorkspaceMember, WorkspaceRole } from './workspace-member.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,

    @InjectRepository(OrganizationInvite)
    private inviteRepo: Repository<OrganizationInvite>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepo: Repository<WorkspaceMember>,

    private jwtService: JwtService,
    private dataSource: DataSource,
    private emailService: EmailService,
  ) {}

  async createInvite(
    userId: string,
    tenantId: string,
    email: string,
    role: WorkspaceRole = WorkspaceRole.MEMBER,
  ) {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    if (
      role !== WorkspaceRole.ADMIN &&
      role !== WorkspaceRole.MEMBER &&
      role !== WorkspaceRole.GUEST
    ) {
      throw new BadRequestException('Invalid invitation role');
    }

    const inviterMembership = await this.workspaceMemberRepo.findOne({
      where: {
        user: { id: userId },
        tenant: { id: tenantId },
      },
    });

    if (!inviterMembership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (
      inviterMembership.role !== WorkspaceRole.OWNER &&
      inviterMembership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only workspace owners and admins can invite members',
      );
    }

    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Workspace not found');
    }

    const existingUser = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const existingMembership = await this.workspaceMemberRepo.findOne({
        where: {
          user: { id: existingUser.id },
          tenant: { id: tenantId },
        },
      });

      if (existingMembership) {
        throw new ConflictException(
          'User is already a member of this workspace',
        );
      }
    }

    const existingInvite = await this.inviteRepo.findOne({
      where: {
        email: normalizedEmail,
        tenant: { id: tenantId },
        accepted: false,
      },
      relations: {
        tenant: true,
      },
    });

    if (existingInvite && existingInvite.expiresAt > new Date()) {
      throw new ConflictException(
        'An active invitation already exists for this email',
      );
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let invite: OrganizationInvite;

    if (existingInvite) {
      existingInvite.tokenHash = tokenHash;
      existingInvite.role = role;
      existingInvite.expiresAt = expiresAt;

      invite = existingInvite;
    } else {
      invite = this.inviteRepo.create({
        email: normalizedEmail,
        tokenHash,
        tenant,
        role,
        expiresAt,
      });
    }

    const savedInvite = await this.inviteRepo.save(invite);

    try {
      await this.emailService.sendWorkspaceInviteEmail(
        normalizedEmail,
        tenant.name,
        token,
      );
    } catch (error) {
      if (!existingInvite) {
        await this.inviteRepo.delete(savedInvite.id);
      }

      throw error;
    }

    return {
      message: 'Workspace invitation sent successfully',
    };
  }

  async create(data: { name: string }) {
    if (!data.name) {
      throw new BadRequestException('Tenant name is required');
    }

    const tenant = this.tenantRepo.create({
      name: data.name,
    });

    return await this.tenantRepo.save(tenant);
  }

 async getOrganizationUsers(tenantId: string) {
  const memberships = await this.workspaceMemberRepo.find({
    where: {
      tenant: {
        id: tenantId,
      },
    },
    relations: {
      user: true,
    },
    order: {
      createdAt: 'ASC',
    },
  });

  return memberships.map((membership) => ({
    id: membership.user.id,
    name: membership.user.name,
    email: membership.user.email,
    role: membership.role,
    joinedAt: membership.createdAt,
  }));
}

  async getUserWorkspaces(userId: string) {
    const memberships = await this.workspaceMemberRepo.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        tenant: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return memberships.map((membership) => ({
      id: membership.tenant.id,
      name: membership.tenant.name,
      role: membership.role,
      joinedAt: membership.createdAt,
    }));
  }

  async getInitialWorkspace(userId: string) {
    const membership = await this.workspaceMemberRepo.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        tenant: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    if (!membership) {
      throw new ForbiddenException('User does not belong to any workspace');
    }

    return {
      id: membership.tenant.id,
      name: membership.tenant.name,
      role: membership.role,
    };
  }

  async switchWorkspace(userId: string, tenantId: string, globalRole: Role) {
    const membership = await this.workspaceMemberRepo.findOne({
      where: {
        user: {
          id: userId,
        },
        tenant: {
          id: tenantId,
        },
      },
      relations: {
        tenant: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const payload = {
      userId,
      tenantId: membership.tenant.id,
      role: globalRole,
      workspaceRole: membership.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Workspace switched successfully',
      token,
      workspace: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        role: membership.role,
      },
    };
  }

  async createWorkspace(userId: string, name: string) {
    const workspaceName = name?.trim();

    if (!workspaceName) {
      throw new BadRequestException('Workspace name is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const tenantRepo = manager.getRepository(Tenant);
      const workspaceMemberRepo = manager.getRepository(WorkspaceMember);

      const user = await userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const workspace = tenantRepo.create({
        name: workspaceName,
      });

      const savedWorkspace = await tenantRepo.save(workspace);

      const membership = workspaceMemberRepo.create({
        tenant: savedWorkspace,
        user,
        role: WorkspaceRole.OWNER,
      });

      await workspaceMemberRepo.save(membership);

      return {
        id: savedWorkspace.id,
        name: savedWorkspace.name,
        role: membership.role,
        joinedAt: membership.createdAt,
      };
    });
  }

  async acceptInviteForExistingUser(userId: string, token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Invitation token is required');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const result = await this.dataSource.transaction(async (manager) => {
      const inviteRepo = manager.getRepository(OrganizationInvite);
      const userRepo = manager.getRepository(User);
      const workspaceMemberRepo = manager.getRepository(WorkspaceMember);

      const invite = await inviteRepo.findOne({
        where: { tokenHash },
        relations: {
          tenant: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!invite) {
        throw new BadRequestException('Invalid invitation');
      }

      if (invite.accepted) {
        throw new BadRequestException('Invitation has already been accepted');
      }

      if (invite.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException('Invitation has expired');
      }

      const user = await userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const userEmail = user.email.trim().toLowerCase();
      const inviteEmail = invite.email.trim().toLowerCase();

      if (userEmail !== inviteEmail) {
        throw new ForbiddenException(
          'This invitation belongs to a different email address',
        );
      }

      const existingMembership = await workspaceMemberRepo.findOne({
        where: {
          tenant: { id: invite.tenant.id },
          user: { id: user.id },
        },
      });

      if (existingMembership) {
        throw new ConflictException(
          'User is already a member of this workspace',
        );
      }

      if (invite.role === WorkspaceRole.OWNER) {
        throw new BadRequestException(
          'OWNER role cannot be assigned through an invitation',
        );
      }

      const membership = workspaceMemberRepo.create({
        tenant: invite.tenant,
        user,
        role: invite.role,
      });

      await workspaceMemberRepo.save(membership);

      invite.accepted = true;
      await inviteRepo.save(invite);

      return {
        userId: user.id,
        globalRole: user.role,
        workspace: {
          id: invite.tenant.id,
          name: invite.tenant.name,
          role: membership.role,
        },
      };
    });

    const payload = {
      userId: result.userId,
      tenantId: result.workspace.id,
      role: result.globalRole,
      workspaceRole: result.workspace.role,
    };

    const tokenForWorkspace = this.jwtService.sign(payload);

    return {
      message: 'Workspace invitation accepted successfully',
      token: tokenForWorkspace,
      workspace: result.workspace,
    };
  }

  async acceptInviteForNewUser(token: string, name: string, password: string) {
    const normalizedName = name?.trim();

    if (!token?.trim()) {
      throw new BadRequestException('Invitation token is required');
    }

    if (!normalizedName || !password) {
      throw new BadRequestException('Name and password are required');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await this.dataSource.transaction(async (manager) => {
      const inviteRepo = manager.getRepository(OrganizationInvite);
      const userRepo = manager.getRepository(User);
      const workspaceMemberRepo = manager.getRepository(WorkspaceMember);

      const invite = await inviteRepo.findOne({
        where: { tokenHash },
        relations: {
          tenant: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!invite) {
        throw new BadRequestException('Invalid invitation');
      }

      if (invite.accepted) {
        throw new BadRequestException('Invitation has already been accepted');
      }

      if (invite.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException('Invitation has expired');
      }

      if (invite.role === WorkspaceRole.OWNER) {
        throw new BadRequestException(
          'OWNER role cannot be assigned through an invitation',
        );
      }

      const normalizedEmail = invite.email.trim().toLowerCase();

      const existingUser = await userRepo.findOne({
        where: {
          email: normalizedEmail,
        },
      });

      if (existingUser) {
        throw new ConflictException(
          'An account already exists for this email. Please sign in to accept the invitation.',
        );
      }

      const user = userRepo.create({
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,

        // Temporary legacy compatibility.
        tenant: invite.tenant,

        role: Role.USER,

        isEmailVerified: false,
        emailVerificationToken: verificationTokenHash,
        emailVerificationExpiresAt: verificationExpiresAt,
      });

      const savedUser = await userRepo.save(user);

      const membership = workspaceMemberRepo.create({
        tenant: invite.tenant,
        user: savedUser,
        role: invite.role,
      });

      await workspaceMemberRepo.save(membership);

      invite.accepted = true;
      await inviteRepo.save(invite);

      return {
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
        },
        workspace: {
          id: invite.tenant.id,
          name: invite.tenant.name,
          role: membership.role,
        },
      };
    });

    try {
      await this.emailService.sendVerificationEmail(
        result.user.email,
        result.user.name,
        verificationToken,
      );
    } catch (error) {
      console.error(
        'Failed to send verification email after invite acceptance:',
        error,
      );
    }

    return {
      message:
        'Account created and workspace invitation accepted. Please verify your email before logging in.',
      user: result.user,
      workspace: result.workspace,
    };
  }
}
