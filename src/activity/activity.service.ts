import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Activity, ActivityAction } from './activity.entity';
import { ForbiddenException, Injectable } from '@nestjs/common';

import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { ProjectMember } from '../project-members/project-member.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,

    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
  ) {}

  async log(
    action: ActivityAction,
    project: Project,
    user: User,
    task?: Task | null,
    metadata?: Record<string, any>,
  ) {
    const activity = this.activityRepo.create({
      action,
      project,
      user,
      task: task ?? null,
      metadata: metadata ?? null,
    });

    return this.activityRepo.save(activity);
  }

  async getProjectActivity(
    projectId: string,
    tenantId: string,
    userId: string,
    limit = 10,
  ) {
    const membership = await this.memberRepo.findOne({
      where: {
        project: {
          id: projectId,
          tenant: {
            id: tenantId,
          },
        },
        user: {
          id: userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const activities = await this.activityRepo.find({
      where: {
        project: {
          id: projectId,
          tenant: {
            id: tenantId,
          },
        },
      },
      relations: ['user', 'task'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    return activities.map((activity) => ({
      id: activity.id,
      action: activity.action,

      user: {
        id: activity.user.id,
        name: activity.user.name,
      },

      task: activity.task
        ? {
            id: activity.task.id,
            title: activity.task.title,
          }
        : null,

      metadata: activity.metadata,
      createdAt: activity.createdAt,
    }));
  }
}
