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
    const activity = this.activityRepo.create({
      action,
      project,
      user,
      task: task ?? null,
      metadata: metadata ?? null,
    });

    return this.activityRepo.save(activity);
  }

  async getProjectActivity(projectId: string) {
    return this.activityRepo.find({
      where: {
        project: {
          id: projectId,
        },
      },
      relations: ['user', 'task'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}