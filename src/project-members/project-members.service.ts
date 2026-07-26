import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  async addMember(projectId: string, email: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });

    const user = await this.userRepo.findOne({
      where: { email: email },
    });

    if (!project) {
      throw new Error('Project not found');
    }

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
}