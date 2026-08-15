import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  InvitationStatus,
  ProjectInvitation,
} from './project-invitation.entity';

import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { ProjectRole } from '../common/enums/project-role.enum';

@Injectable()
export class ProjectInvitationsService {
  constructor(
    @InjectRepository(ProjectInvitation)
    private invitationRepo: Repository<ProjectInvitation>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,
  ) {}

  async createInvitation(
    projectId: string,
    invitedUserId: string,
    invitedById: string,
    tenantId: string,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
        tenant: {
          id: tenantId,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const invitedBy = await this.userRepo.findOne({
      where: {
        id: invitedById,
      },
    });

    if (!invitedBy) {
      throw new NotFoundException('Inviting user not found');
    }

    const invitedUser = await this.userRepo.findOne({
      where: {
        id: invitedUserId,
      },
      relations: ['tenant'],
    });

    if (!invitedUser) {
      throw new NotFoundException('User not found');
    }

    if (invitedUser.tenant.id !== tenantId) {
      throw new ForbiddenException(
        'User belongs to another organization',
      );
    }

    const existingMember = await this.memberRepo.findOne({
      where: {
        project: {
          id: projectId,
        },
        user: {
          id: invitedUserId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException(
        'User is already a member of this project',
      );
    }

    const existingInvitation =
      await this.invitationRepo.findOne({
        where: {
          project: {
            id: projectId,
          },
          invitedUser: {
            id: invitedUserId,
          },
          status: InvitationStatus.PENDING,
        },
      });

    if (existingInvitation) {
      throw new BadRequestException(
        'A pending invitation already exists',
      );
    }

    const invitation = this.invitationRepo.create({
      project,
      invitedUser,
      invitedBy,
      status: InvitationStatus.PENDING,
    });

    return this.invitationRepo.save(invitation);
  }

  async getMyInvitations(
    userId: string,
    tenantId: string,
  ) {
    return this.invitationRepo.find({
      where: {
        invitedUser: {
          id: userId,
          tenant: {
            id: tenantId,
          },
        },
        status: InvitationStatus.PENDING,
      },
      relations: [
        'project',
        'invitedBy',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async acceptInvitation(
    invitationId: string,
    userId: string,
    tenantId: string,
  ) {
    const invitation = await this.invitationRepo.findOne({
      where: {
        id: invitationId,
        invitedUser: {
          id: userId,
          tenant: {
            id: tenantId,
          },
        },
        status: InvitationStatus.PENDING,
      },
      relations: [
        'project',
        'invitedUser',
      ],
    });

    if (!invitation) {
      throw new NotFoundException(
        'Pending invitation not found',
      );
    }

    const existingMember = await this.memberRepo.findOne({
      where: {
        project: {
          id: invitation.project.id,
        },
        user: {
          id: userId,
        },
      },
    });

    if (existingMember) {
      invitation.status = InvitationStatus.ACCEPTED;

      await this.invitationRepo.save(invitation);

      return {
        message: 'Invitation accepted',
      };
    }

    await this.memberRepo.save({
      project: invitation.project,
      user: invitation.invitedUser,
      role: ProjectRole.MEMBER,
    });

    invitation.status = InvitationStatus.ACCEPTED;

    await this.invitationRepo.save(invitation);

    return {
      message: 'Invitation accepted',
    };
  }

  async rejectInvitation(
    invitationId: string,
    userId: string,
    tenantId: string,
  ) {
    const invitation = await this.invitationRepo.findOne({
      where: {
        id: invitationId,
        invitedUser: {
          id: userId,
          tenant: {
            id: tenantId,
          },
        },
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException(
        'Pending invitation not found',
      );
    }

    invitation.status = InvitationStatus.REJECTED;

    await this.invitationRepo.save(invitation);

    return {
      message: 'Invitation rejected',
    };
  }
}