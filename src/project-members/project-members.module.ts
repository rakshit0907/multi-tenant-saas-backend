import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectMember } from './project-member.entity';
import { ProjectMembersService } from './project-members.service';
import { ProjectMembersController } from './project-members.controller';

import { User } from '../users/user.entity';
import { Project } from '../project/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectMember,
      User,
      Project,
    ]),
  ],
  controllers: [ProjectMembersController],
  providers: [ProjectMembersService],
})
export class ProjectMembersModule {}