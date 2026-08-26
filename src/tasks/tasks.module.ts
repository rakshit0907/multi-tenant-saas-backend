import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TaskComment } from './task-comment.entity';
import { TaskCommentsService } from './task-comments.service';
@Module({
  imports: [TypeOrmModule.forFeature([Task, Project, User, ProjectMember, TaskComment,]), ActivityModule, NotificationsModule, ],
  controllers: [TasksController],
  providers: [TasksService, TaskCommentsService,]
})
export class TasksModule {}
