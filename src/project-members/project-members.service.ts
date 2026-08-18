import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectRole } from '../common/enums/project-role.enum';
import { ProjectMember } from './project-member.entity';
import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/activity.entity';
@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private activityService: ActivityService,
  ) {}

  async addMember(
    projectId: string,
    userId: string,
    requesterId: string,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
     },
      relations: ['tenant'],
     });

     if (!project) {
       throw new NotFoundException('Project not found');
     }

     await this.verifyOwner(projectId, requesterId);

     const user = await this.userRepo.findOne({
       where: {
        id: userId,
       },
       relations: ['tenant'],
     });

     if (!user) {
       throw new NotFoundException('User not found');
     }

     if (user.tenant.id !== project.tenant.id) {
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
          id: userId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException(
        'User is already a member of this project',
      );
    }

    const member = this.memberRepo.create({
      project,
      user,
      role: ProjectRole.MEMBER,
    });

    const savedMember = await this.memberRepo.save(member);

    await this.activityService.log(
      ActivityAction.MEMBER_ADDED,
      project,
      { id: requesterId } as User,
      null,
      {
        addedUserId: user.id,
        addedUserName: user.name,
        role: ProjectRole.MEMBER,
      },
    );

    return savedMember;
  }

  async getMembers(projectId: string, tenantId: string,) {

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

     return this.memberRepo.find({
       where: {
         project: {
           id: projectId,
         },
       },
       relations: ['user'],
     });
   }

  async removeMember(
    projectId: string,
    userId: string,
    requesterId: string,
  ) {

    await this.verifyOwner(projectId, requesterId);
    const member = await this.memberRepo.findOne({
      where: {
        project: { id: projectId },
        user: { id: userId },
      },
      relations: ["project", "user"],
    });

    if (!member) {
      throw new NotFoundException("Member not found");
    }

    if (member.role === ProjectRole.OWNER) {
      throw new BadRequestException(
        'Project owner cannot be removed',
      );
    }

    await this.activityService.log(
      ActivityAction.MEMBER_REMOVED,
      member.project,
      { id: requesterId } as User,
      null,
      {
        removedUserId: member.user.id,
        removedUserName: member.user.name,
      },
    );

    await this.memberRepo.remove(member);
    return {
      message: "Member removed successfully",
    };
  }

  async updateRole(
  projectId: string,
  userId: string,
  role: ProjectRole,
  requesterId: string,
) {
  await this.verifyOwner(projectId, requesterId);

  const member = await this.memberRepo.findOne({
    where: {
      project: {
        id: projectId,
      },
      user: {
        id: userId,
      },
    },
    relations: ['project', 'user'],
   });

   if (!member) {
     throw new NotFoundException('Member not found');
   }

   if (member.role === ProjectRole.OWNER) {
     throw new BadRequestException(
       'Owner role cannot be changed',
   );
  }

  if (role === ProjectRole.OWNER) {
    throw new BadRequestException(
      'Cannot assign OWNER role through this endpoint',
    );
  }
  const oldRole = member.role;
  member.role = role;

  const savedMember = await this.memberRepo.save(member);

  await this.activityService.log(
     ActivityAction.MEMBER_ROLE_CHANGED,
      member.project,
      { id: requesterId } as User,
      null,
      {
        targetUserId: member.user.id,
        targetUserName: member.user.name,
        oldRole,
        newRole: role,
      },
  );  

  return savedMember;
}
   
  async getMyRole(
    projectId: string,
    userId: string,
  ) {
    const member = await this.memberRepo.findOne({
      where: {
        project: { id: projectId },
        user: { id: userId },
      },
    });

    if (!member) {
      throw new ForbiddenException("Not a project member");
    }

    return {
      role: member.role,
    };
  }

  private async verifyOwner(
    projectId: string,
    userId: string,
  ) {
    const membership = await this.memberRepo.findOne({
      where: {
        project: { id: projectId },
        user: { id: userId },
      },
    });

    if (!membership || membership.role !== ProjectRole.OWNER) {
      throw new ForbiddenException(
        'Only project owners can perform this action',
      );
    }
  }
}