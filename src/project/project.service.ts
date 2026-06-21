import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private repo: Repository<Project>,
  ) {}

  async create(name: string, tenantId: string) {
    console.log("SERVICE tenantId:", tenantId);
    return this.repo.save({
      name,
      tenant: { id: tenantId },
    });
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

  return this.repo.remove(project);
}
  async findAll(tenantId: string) {
    return this.repo.find({
      where: { tenant: { id: tenantId } },
    });
  }
}