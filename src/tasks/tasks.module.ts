import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
import { ProjectMember } from '../project-members/project-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Project, User, ProjectMember,])],
  controllers: [TasksController],
  providers: [TasksService]
})
export class TasksModule {}
