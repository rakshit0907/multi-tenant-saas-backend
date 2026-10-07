import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectMember } from '../project-members/project-member.entity';
import { Task } from '../tasks/task.entity';
import { ActivityModule } from '../activity/activity.module';
import { Milestone } from './milestone.entity';
import { MilestoneService } from './milestone.service';
import { MilestoneController } from './milestone.controller';
import { WorkspaceMember } from '../tenant/workspace-member.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectMember,
      Task,
      Milestone,
      WorkspaceMember,
    ]),
    ActivityModule,
  ],
  providers: [ProjectService, MilestoneService],
  controllers: [ProjectController, MilestoneController],
})
export class ProjectModule {}
