import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
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

  async addMember(projectId: string, email: string, requesterId: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });

    const user = await this.userRepo.findOne({
      where: { email: email },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    await this.verifyOwner(projectId, requesterId);

    if (!user) {
      throw new Error('User not found');
    }

    const existingMember = await this.memberRepo.findOne({
      where: {
        project: { id: projectId },
        user: { id: user.id },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this project');
    }
    

    const member = this.memberRepo.create({
      project,
      user,
    });

    return this.memberRepo.save(member);
  }

  async getMembers(projectId: string) {
    return this.memberRepo.find({
      where: {
        project: {
          id: projectId,
        },
      },
      relations: ["user"],
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
      throw new Error("Member not found");
    }

    await this.memberRepo.remove(member);

    return {
      message: "Member removed successfully",
    };
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
      throw new Error("Not a project member");
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