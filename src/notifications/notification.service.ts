import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { Notification, NotificationType } from './notification.entity';

import { User } from '../users/user.entity';
import { Project } from '../project/project.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(data: {
    user: User;
    type: NotificationType;
    title: string;
    message: string;
    project?: Project | null;
    tenant?: Tenant | null;
    metadata?: Record<string, any>;
  }) {
    const notification = this.notificationRepo.create({
      user: data.user,
      type: data.type,
      title: data.title,
      message: data.message,
      project: data.project ?? null,
      tenant: data.tenant ?? null,
      metadata: data.metadata ?? null,
      isRead: false,
    });

    return this.notificationRepo.save(notification);
  }

  async getMyNotifications(userId: string, tenantId: string, limit = 20) {
    return this.notificationRepo.find({
      where: [
        {
          user: {
            id: userId,
          },
          project: {
            tenant: {
              id: tenantId,
            },
          },
        },
        {
          user: {
            id: userId,
          },
          tenant: {
            id: tenantId,
          },
        },
        {
          user: {
            id: userId,
          },
          type: NotificationType.WORKSPACE_INVITATION,
        },
      ],
      relations: ['project', 'tenant'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  async getUnread(userId: string, tenantId: string) {
    return this.notificationRepo.find({
      where: [
        {
          user: {
            id: userId,
          },
          project: {
            tenant: {
              id: tenantId,
            },
          },
          isRead: false,
        },
        {
          user: {
            id: userId,
          },
          tenant: {
            id: tenantId,
          },
          isRead: false,
        },
        {
          user: {
            id: userId,
          },
          type: NotificationType.WORKSPACE_INVITATION,
          isRead: false,
        },
      ],
      relations: ['project', 'tenant'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getUnreadCount(userId: string, tenantId: string) {
    return this.notificationRepo.count({
      where: [
        {
          user: {
            id: userId,
          },
          project: {
            tenant: {
              id: tenantId,
            },
          },
          isRead: false,
        },
        {
          user: {
            id: userId,
          },
          tenant: {
            id: tenantId,
          },
          isRead: false,
        },
        {
          user: {
            id: userId,
          },
          type: NotificationType.WORKSPACE_INVITATION,
          isRead: false,
        },
      ],
    });
  }

  async markAsRead(notificationId: string, userId: string, tenantId: string) {
    const notification = await this.notificationRepo.findOne({
      where: [
        {
          id: notificationId,
          user: {
            id: userId,
          },
          project: {
            tenant: {
              id: tenantId,
            },
          },
        },
        {
          id: notificationId,
          user: {
            id: userId,
          },
          tenant: {
            id: tenantId,
          },
        },
        {
          id: notificationId,
          user: {
            id: userId,
          },
          type: NotificationType.WORKSPACE_INVITATION,
        },
      ],
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;

    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string, tenantId: string) {
    const notifications = await this.notificationRepo.find({
      where: [
        {
          user: {
            id: userId,
          },
          project: {
            tenant: {
              id: tenantId,
            },
          },
          isRead: false,
        },
        {
          user: {
            id: userId,
          },
          tenant: {
            id: tenantId,
          },
          isRead: false,
        },
        {
          user: {
            id: userId,
          },
          type: NotificationType.WORKSPACE_INVITATION,
          isRead: false,
        },
      ],
      select: {
        id: true,
      },
    });

    if (notifications.length > 0) {
      await this.notificationRepo.update(
        {
          id: In(notifications.map((notification) => notification.id)),
        },
        {
          isRead: true,
        },
      );
    }

    return {
      message: 'All notifications marked as read',
    };
  }
}
