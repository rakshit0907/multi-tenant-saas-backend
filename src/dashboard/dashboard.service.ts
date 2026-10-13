import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Project, ProjectStatus } from '../project/project.entity';
import { Milestone, MilestoneStatus } from '../project/milestone.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { Task, TaskStatus } from '../tasks/task.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,

    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
  ) {}

  async getSummary(tenantId: string, userId: string) {
    const memberships = await this.projectMemberRepo.find({
      where: {
        user: {
          id: userId,
        },
        project: {
          tenant: {
            id: tenantId,
          },
        },
      },
      relations: ['project'],
    });

    const projectIds = memberships.map((membership) => membership.project.id);

    if (projectIds.length === 0) {
      return {
        projects: {
          total: 0,
          active: 0,
          completed: 0,
        },
        tasks: {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          open: 0,
          dueSoon: [],
        },
        upcomingMilestones: [],
      };
    }

    const [projects, tasks, milestones] = await Promise.all([
      this.projectRepo.find({
        where: {
          id: In(projectIds),
          tenant: {
            id: tenantId,
          },
        },
      }),

      this.taskRepo.find({
        where: {
          project: {
            id: In(projectIds),
            tenant: {
              id: tenantId,
            },
          },
        },
        relations: ['project', 'assignee'],
      }),

      this.milestoneRepo.find({
        where: {
          project: {
            id: In(projectIds),
            tenant: {
              id: tenantId,
            },
          },
        },
        relations: ['project'],
      }),
    ]);

    const now = new Date();

    const dueSoonLimit = new Date(now);
    dueSoonLimit.setDate(dueSoonLimit.getDate() + 7);

    const dueSoonTasks = tasks
      .filter((task) => {
        if (!task.dueDate) {
          return false;
        }

        const dueDate = new Date(task.dueDate);

        return (
          task.status !== TaskStatus.COMPLETED &&
          dueDate >= now &&
          dueDate <= dueSoonLimit
        );
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )
      .slice(0, 5)
      .map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        project: {
          id: task.project.id,
          name: task.project.name,
        },
        assignee: task.assignee
          ? {
              id: task.assignee.id,
              name: task.assignee.name,
            }
          : null,
      }));

    const upcomingMilestones = milestones
      .filter((milestone) => {
        if (!milestone.targetDate) {
          return false;
        }

        return (
          milestone.status === MilestoneStatus.ACTIVE &&
          new Date(milestone.targetDate) >= now
        );
      })
      .sort(
        (a, b) =>
          new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime(),
      )
      .slice(0, 5)
      .map((milestone) => ({
        id: milestone.id,
        name: milestone.name,
        targetDate: milestone.targetDate,
        project: {
          id: milestone.project.id,
          name: milestone.project.name,
        },
      }));

    const pendingTasks = tasks.filter(
      (task) => task.status === TaskStatus.PENDING,
    ).length;

    const inProgressTasks = tasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS,
    ).length;

    const completedTasks = tasks.filter(
      (task) => task.status === TaskStatus.COMPLETED,
    ).length;

    return {
      projects: {
        total: projects.length,

        active: projects.filter(
          (project) => project.status === ProjectStatus.ACTIVE,
        ).length,

        completed: projects.filter(
          (project) => project.status === ProjectStatus.COMPLETED,
        ).length,
      },

      tasks: {
        total: tasks.length,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        open: pendingTasks + inProgressTasks,
        dueSoon: dueSoonTasks,
      },

      upcomingMilestones,
    };
  }
}
