import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectRole } from '../common/enums/project-role.enum';
import { ProjectMember } from './project-member.entity';
import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
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

    return this.memberRepo.save(member);
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

  member.role = role;

  return this.memberRepo.save(member);
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