import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Notification,
  NotificationType,
} from './notification.entity';

import { User } from '../users/user.entity';
import { Project } from '../project/project.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(
    user: User,
    type: NotificationType,
    title: string,
    message: string,
    project?: Project | null,
    metadata?: Record<string, any>,
  ) {
    const notification = this.notificationRepo.create({
      user,
      type,
      title,
      message,
      project: project ?? null,
      metadata: metadata ?? null,
      isRead: false,
    });

    return this.notificationRepo.save(notification);
  }

  async getMyNotifications(
    userId: string,
    limit = 20,
  ) {
    return this.notificationRepo.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: ['project'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  async getUnread(
    userId: string,
  ) {
    return this.notificationRepo.find({
      where: {
        user: {
          id: userId,
        },
        isRead: false,
      },
      relations: ['project'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getUnreadCount(
    userId: string,
  ) {
    return this.notificationRepo.count({
      where: {
        user: {
          id: userId,
        },
        isRead: false,
      },
    });
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ) {
    const notification =
      await this.notificationRepo.findOne({
        where: {
          id: notificationId,
          user: {
            id: userId,
          },
        },
      });

    if (!notification) {
      return null;
    }

    notification.isRead = true;

    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(
    userId: string,
  ) {
    await this.notificationRepo.update(
      {
        user: {
          id: userId,
        },
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    return {
      message: 'All notifications marked as read',
    };
  }
}