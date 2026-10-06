import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getMyNotifications(@Req() req: any) {
    return this.notificationService.getMyNotifications(
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Get('unread')
  getUnread(@Req() req: any) {
    return this.notificationService.getUnread(
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Patch(':notificationId/read')
  markAsRead(@Param('notificationId') notificationId: string, @Req() req: any) {
    return this.notificationService.markAsRead(
      notificationId,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(
      req.user.userId,
      req.user.tenantId,
    );
  }
}
