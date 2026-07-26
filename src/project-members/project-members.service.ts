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

  async addMember(projectId: string, userId: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (!user) {
      throw new Error('User not found');
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