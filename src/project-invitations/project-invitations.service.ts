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
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.entity';
import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { ProjectRole } from '../common/enums/project-role.enum';
import { WorkspaceMember } from '../tenant/workspace-member.entity';

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

    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepo: Repository<WorkspaceMember>,

    private notificationService: NotificationService,
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
    });

    if (!invitedUser) {
      throw new NotFoundException('User not found');
    }

    const workspaceMembership = await this.workspaceMemberRepo.findOne({
      where: {
        tenant: {
          id: tenantId,
        },
        user: {
          id: invitedUserId,
        },
      },
    });

    if (!workspaceMembership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    const inviterMembership = await this.memberRepo.findOne({
      where: {
        project: {
          id: projectId,
          tenant: {
            id: tenantId,
          },
        },
        user: {
          id: invitedById,
        },
      },
    });

    if (!inviterMembership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (inviterMembership.role !== ProjectRole.OWNER) {
      throw new ForbiddenException('Only the project owner can invite members');
    }

    const existingMember = await this.memberRepo.findOne({
      where: {
        project: {
          id: projectId,
          tenant: {
            id: tenantId,
          },
        },
        user: {
          id: invitedUserId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this project');
    }

    const existingInvitation = await this.invitationRepo.findOne({
      where: {
        project: {
          id: projectId,
          tenant: {
            id: tenantId,
          },
        },
        invitedUser: {
          id: invitedUserId,
        },
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new BadRequestException('A pending invitation already exists');
    }

    const invitation = this.invitationRepo.create({
      project,
      invitedUser,
      invitedBy,
      status: InvitationStatus.PENDING,
    });

    const savedInvitation = await this.invitationRepo.save(invitation);

    await this.notificationService.create({
      user: invitedUser,
      type: NotificationType.PROJECT_INVITATION,
      title: 'New project invitation',
      message: `You have been invited to join ${project.name}`,
      project,
      metadata: {
        invitationId: savedInvitation.id,
        invitedById: invitedBy.id,
      },
    });
    return savedInvitation;
  }

  async getMyInvitations(userId: string, tenantId: string) {
    return this.invitationRepo.find({
      where: {
        invitedUser: {
          id: userId,
        },
        project: {
          tenant: {
            id: tenantId,
          },
        },
        status: InvitationStatus.PENDING,
      },
      relations: ['project', 'invitedBy'],
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
        },
        project: {
          tenant: {
            id: tenantId,
          },
        },
        status: InvitationStatus.PENDING,
      },
      relations: ['project', 'project.tenant', 'invitedUser'],
    });

    if (!invitation) {
      throw new NotFoundException('Pending invitation not found');
    }

    const workspaceMembership = await this.workspaceMemberRepo.findOne({
      where: {
        tenant: {
          id: tenantId,
        },
        user: {
          id: userId,
        },
      },
    });

    if (!workspaceMembership) {
      throw new ForbiddenException(
        'You are no longer a member of this workspace',
      );
    }

    const existingMember = await this.memberRepo.findOne({
      where: {
        project: {
          id: invitation.project.id,
          tenant: {
            id: tenantId,
          },
        },
        user: {
          id: userId,
        },
      },
    });

    if (!existingMember) {
      await this.memberRepo.save({
        project: invitation.project,
        user: invitation.invitedUser,
        role: ProjectRole.MEMBER,
      });
    }

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
        },
        project: {
          tenant: {
            id: tenantId,
          },
        },
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Pending invitation not found');
    }

    invitation.status = InvitationStatus.REJECTED;

    await this.invitationRepo.save(invitation);

    return {
      message: 'Invitation rejected',
    };
  }
}
