import { Body, Controller, Param, Post, Get, Delete, } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
@Controller('projects')
export class ProjectMembersController {
  constructor(
    private readonly projectMembersService: ProjectMembersService,
  ) {}
  @UseGuards(AuthGuard('jwt'))
  @Post(':projectId/members')
  async addMember(
    @Param('projectId') projectId: string,
    @Body('email') email: string,
    @Req() req,
  ) {
    return this.projectMembersService.addMember(
      projectId,
      email,
      req.user.userId,
    );
  }
  
  @UseGuards(AuthGuard('jwt'))
@Get(':projectId/my-role')
getMyRole(
  @Param('projectId') projectId: string,
  @Req() req,
) {
  return this.projectMembersService.getMyRole(
    projectId,
    req.user.userId,
  );
}
  @Get(':projectId/members')
  getMembers(
    @Param('projectId') projectId: string,
  ) {
    return this.projectMembersService.getMembers(projectId);
  }

  @Delete(':projectId/members/:userId')
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Req() req,
  ) {
    return this.projectMembersService.removeMember(
      projectId,
      userId,
      req.user.userId,
    );
  }
}