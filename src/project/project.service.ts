import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { ProjectRole } from '../common/enums/project-role.enum';
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
  async deleteProject(id: string, tenantId: string) {
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
    throw new Error('Project not found');
  }

  await this.repo.remove(project);

  return {
    message: "Project detailed successfully",
  };
}
  async findAll(tenantId: string) {
    return this.repo.find({
      where: { tenant: { id: tenantId } },
    });
  }
}