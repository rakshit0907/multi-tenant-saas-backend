import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { ProjectRole } from '../common/enums/project-role.enum';
import { ForbiddenException } from '@nestjs/common';
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private repo: Repository<Project>,

    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,
  ) {}

  async create(name: string, tenantId: string, userId: string,) {
    const project = await this.repo.save({
      name,
      tenant: { id: tenantId },
    });

    await this.memberRepo.save({
      project,
      user: { id: userId },
      role: ProjectRole.OWNER,
    });
    return project;
  }
  async deleteProject(id: string, tenantId: string, userId: string,) {
  const project = await this.repo.findOne({
    where: {
      id,
      tenant: {
        id: tenantId,
      },
    },
    relations: ['tenant'],
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const membership = await this.memberRepo.findOne({
    where: {
      project: { id },
      user: { id: userId },
    },
  });

  if (!membership || membership.role !== ProjectRole.OWNER) {
    throw new ForbiddenException(
      "Only the project owner can delete this project",
    );
  }

  await this.repo.remove(project);

  return {
    message: "Project deleted successfully",
  };
}
  async findAll(tenantId: string, userId: string,) {

    console.log("USER ID:", userId);
    console.log("TENANT ID:", tenantId);

    const memberships = await this.memberRepo.find({
      where: {
        user: { id: userId },
        project: { 
          tenant: { id: tenantId }, 
        },
       },
       relations: ["project"],
    });

    console.log("MEMBERSHIPS:", memberships);
    return memberships
        .map((m) => m.project);
  }
}