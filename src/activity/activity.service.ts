import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Activity,
  ActivityAction,
} from './activity.entity';

import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  async log(
    action: ActivityAction,
    project: Project,
    user: User,
    task?: Task | null,
    metadata?: Record<string, any>,
  ) {
    console.log('ACTIVITY LOGGING:', {
      action,
      projectId: project.id,
      userId: user.id,
      taskId: task?.id,
    });
    
    const activity = this.activityRepo.create({
      action,
      project,
      user,
      task: task ?? null,
      metadata: metadata ?? null,
    });

    return this.activityRepo.save(activity);
  }

  async getProjectActivity(projectId: string, tenantId: string, limit = 10,) {
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