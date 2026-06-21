import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../project/project.entity';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private repo: Repository<Task>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}
  async toggleComplete(id: string) {
  const task = await this.repo.findOne({
    where: { id },
  });

  if (!task) {
    return null;
  }

  task.completed = !task.completed;

  return this.repo.save(task);
}
  async getStats(
  projectId: string,
  tenantId: string,
) {
  const tasks = await this.getTasks(
    projectId,
    tenantId,
  );

  const total = tasks.length;

  const completed = tasks.filter(
    (t) => t.completed,
  ).length;

  return {
    total,
    completed,
    pending: total - completed,
  };
}
  async createTask(
    title: string,
    projectId: string,
    tenantId: string,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
        tenant: {
          id: tenantId,
        },
      },
      relations: ['tenant'],
    });

    if (!project) {
      throw new Error(
        'Project not found or does not belong to your tenant',
      );
    }

    const task = this.repo.create({
      title,
      project: project!,
    });

    return this.repo.save(task);
  }

  async getTasks(
    projectId: string,
    tenantId: string,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
        tenant: {
          id: tenantId,
        },
      },
      relations: ['tenant'],
    });

    if (!project) {
      throw new Error(
        'Project not found or does not belong to your tenant',
      );
    }

    return this.repo.find({
      where: {
        project: {
          id: projectId,
        },
      },
      relations: ['project'],
    });
  }

  async updateTask(
    id: string,
    title: string,
  ) {
    const task = await this.repo.findOne({
      where: { id },
    });

    if (!task) {
      return null;
    }

    task.title = title;

    return this.repo.save(task);
  }

  async deleteTask(id: string) {
    const task = await this.repo.findOne({
      where: { id },
    });

    if (!task) {
      return null;
    }

    return this.repo.remove(task);
  }
}