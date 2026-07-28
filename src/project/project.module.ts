import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectMember } from '../project-members/project-member.entity';
@Module({
    imports: [TypeOrmModule.forFeature([Project, ProjectMember,])],
    providers: [ProjectService],
    controllers: [ProjectController],
})
export class ProjectModule {}