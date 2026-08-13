import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectMember } from '../project-members/project-member.entity';
import { Task } from '../tasks/task.entity';
import { ActivityModule } from '../activity/activity.module';
@Module({
    imports: [TypeOrmModule.forFeature([Project, ProjectMember, Task,]), ActivityModule,],
    providers: [ProjectService],
    controllers: [ProjectController],
})
export class ProjectModule {}