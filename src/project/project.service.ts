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

  async findAll(tenantId: string) {
    return this.repo.find({
      where: { tenant: { id: tenantId } },
    });
  }
}