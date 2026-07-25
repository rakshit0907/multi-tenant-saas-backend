import { Body, Controller, Param, Post } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';

@Controller('projects')
export class ProjectMembersController {
  constructor(
    private readonly projectMembersService: ProjectMembersService,
  ) {}

  @Post(':projectId/members')
  async addMember(
    @Param('projectId') projectId: string,
    @Body('userId') userId: string,
  ) {
    return this.projectMembersService.addMember(
      projectId,
      userId,
    );
  }
}1