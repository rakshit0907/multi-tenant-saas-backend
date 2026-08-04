import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../project/project.entity';
import { Task, TaskPriority, TaskStatus } from './task.entity';
import { User } from '../users/user.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private repo: Repository<Task>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,
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
    description: string,
    projectId: string,
    tenantId: string,
    priority: TaskPriority,
    status: TaskStatus = TaskStatus.PENDING,
    dueDate?: Date,
    assigneeId?: string,
   )
  {
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
      throw new NotFoundException(
        'Project not found or does not belong to your tenant',
      );
    }

    let assignee: User | null = null;

    if (assigneeId) {
      assignee = await this.userRepo.findOne({
        where: { id: assigneeId },
      });

      if (!assignee) {
        throw new NotFoundException("Assignee not found");
      }

      const membership = await this.memberRepo.findOne({
        where: {
          project: { id: projectId },
          user: { id: assigneeId },
        },
      });

      if (!membership) {
        throw new BadRequestException(
          "User is not a member of this project",
       );
     }
   }

   const task = this.repo.create({
    title,
    dueDate,
    priority,
    description,
    status,
    project,
    assignee: assignee ?? undefined,
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
      throw new NotFoundException(
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
    description: string,
    priority: TaskPriority,
    status: TaskStatus,
    dueDate?: Date,
    assigneeId?: string,
  ) {
    const task = await this.repo.findOne({
      where: { id },
    });

    if (!task) {
      return null;
    }

    task.title = title;
    task.description = description;
    task.priority = priority;
    task.status = status;
    if (dueDate !== undefined) {
      task.dueDate = dueDate;
    }

    return this.repo.save(task);
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
  ) {
    const task = await this.repo.findOne({
      where: { id },
    });

    if (!task) {
      return null;
    }

    task.status = status;
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