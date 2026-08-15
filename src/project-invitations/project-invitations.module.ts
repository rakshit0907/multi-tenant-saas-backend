import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectInvitation } from './project-invitation.entity';
import { ProjectInvitationsService } from './project-invitations.service';
import { ProjectInvitationsController } from './project-invitations.controller';
import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectInvitation,
      Project,
      User,
      ProjectMember,
    ]),
    NotificationsModule,
  ],
  providers: [
    ProjectInvitationsService,
  ],
  exports: [
    ProjectInvitationsService,
  ],
  controllers: [
    ProjectInvitationsController,
],
})
export class ProjectInvitationsModule {}