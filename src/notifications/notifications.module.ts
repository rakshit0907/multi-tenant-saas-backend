import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
    ]),
  ],
  controllers: [
    NotificationsController,
  ],
  providers: [
    NotificationService,
  ],
  exports: [
    NotificationService,
  ],
})
export class NotificationsModule {}