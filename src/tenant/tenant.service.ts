import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Tenant } from './tenant.entity';
import { OrganizationInvite } from './organization-invite.entity';
import { User } from '../users/user.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Role } from '../common/enums/role.enum';
import { WorkspaceMember, WorkspaceRole } from './workspace-member.entity';
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
  ) {}

  async createInvite(
    tenantId: string,
    email: string,
    role: WorkspaceRole = WorkspaceRole.MEMBER,
  ) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    if (role === WorkspaceRole.OWNER) {
      throw new BadRequestException(
        'OWNER role cannot be assigned through an invitation',
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
        throw new BadRequestException(
          'User is already a member of this workspace',
        );
      }
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const invite = this.inviteRepo.create({
      email: normalizedEmail,
      tokenHash,
      tenant,
      role,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await this.inviteRepo.save(invite);

    return {
      message: 'Invite created',
      token,
    };
  }

  async acceptInvite(token: string, name: string, password: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const invite = await this.inviteRepo.findOne({
      where: {
        tokenHash,
      },
      relations: ['tenant'],
    });

    if (!invite) {
      throw new BadRequestException('Invalid invite');
    }

    if (invite.accepted) {
      throw new BadRequestException('Invite has already been accepted');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite expired');
    }

    const existingUser = await this.userRepo.findOne({
      where: {
        email: invite.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      name,
      email: invite.email,
      password: hashedPassword,
      role: Role.USER,
      tenant: invite.tenant,
    });

    const savedUser = await this.userRepo.save(user);

    invite.accepted = true;
    await this.inviteRepo.save(invite);

    const payload = {
      userId: savedUser.id,
      tenantId: invite.tenant.id,
      role: savedUser.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        tenantId: invite.tenant.id,
      },
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
    return this.userRepo.find({
      where: {
        tenant: {
          id: tenantId,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      order: {
        name: 'ASC',
      },
    });
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
}
