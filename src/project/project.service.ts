import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { ProjectRole } from '../common/enums/project-role.enum';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskPriority, TaskStatus } from '../tasks/task.entity';
import { Task } from '../tasks/task.entity';
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private repo: Repository<Project>,

    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,

    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
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

  async getDashboard(
    projectId: string,
    tenantId: string,
    userId: string,
  ) {
    const project = await this.repo.findOne({
      where: {
        id: projectId,
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
        project: {
          id: projectId,
        },
        user: {
          id: userId,
        },
      },
   });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this project',
      );
    }

    const tasks = await this.taskRepo.find({
      where: {
        project: {
          id: projectId,
        },
      },
    });

    const total = tasks.length;

    const pending = tasks.filter(
      (task: any) => task.status === TaskStatus.PENDING,
    ).length;

    const inProgress = tasks.filter(
      (task: any) => task.status === TaskStatus.IN_PROGRESS,
    ).length;

    const completed = tasks.filter(
      (task: any) => task.status === TaskStatus.COMPLETED,
    ).length;

    const low = tasks.filter(
      (task: any) => task.priority === TaskPriority.LOW,
    ).length;

    const medium = tasks.filter(
      (task: any) => task.priority === TaskPriority.MEDIUM,
    ).length;

    const high = tasks.filter(
      (task: any) => task.priority === TaskPriority.HIGH,
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueToday = tasks.filter((task: any) => {
      if (!task.dueDate) return false;

    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);

    return due.getTime() === today.getTime();
  }).length;

    const overdue = tasks.filter((task: any) => {
      if (!task.dueDate) return false;

      return (
        new Date(task.dueDate) < today &&
        task.status !== TaskStatus.COMPLETED
      );
    }).length;

    const completionPercentage =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    const members = await this.memberRepo.count({
      where: {
        project: {
          id: projectId,
        },
      },
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        createdAt: project.created_at,
      },

      tasks: {
        total,
        pending,
        inProgress,
        completed,
        overdue,
        dueToday,
        completionPercentage,
      },

      priority: {
        low,
        medium,
        high,
      },

      members: {
        total: members,
      },
    };
  }
}