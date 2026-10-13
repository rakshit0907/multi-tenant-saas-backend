import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

import { Project } from '../project/project.entity';
import { Task } from '../tasks/task.entity';
import { Milestone } from '../project/milestone.entity';
import { ProjectMember } from '../project-members/project-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, Milestone, ProjectMember]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
