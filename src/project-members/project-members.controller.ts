import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';

@Controller('projects')
export class ProjectMembersController {
  constructor(
    private readonly projectMembersService: ProjectMembersService,
  ) {}

  @Post(':projectId/members')
  async addMember(
    @Param('projectId') projectId: string,
    @Body('email') email: string,
  ) {
    return this.projectMembersService.addMember(
      projectId,
      email,
    );
  }

  @Get(':projectId/members')
  getMembers(
    @Param('projectId') projectId: string,
  ) {
    return this.projectMembersService.getMembers(projectId);
  }
}