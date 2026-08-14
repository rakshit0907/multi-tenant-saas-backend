import { Body, Controller, Param, Post, Get, Delete, Patch, } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
@Controller('projects')
export class ProjectMembersController {
  constructor(
    private readonly projectMembersService: ProjectMembersService,
  ) {}
  @UseGuards(AuthGuard('jwt'))
  @Post(':projectId/members')
  async addMember(
    @Param('projectId') projectId: string,
    @Body() body: AddMemberDto,
    @Req() req,
  ) {
    return this.projectMembersService.addMember(
      projectId,
      body.userId,
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
  @UseGuards(AuthGuard('jwt'))
  @Get(':projectId/members')
  getMembers(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.projectMembersService.getMembers(projectId, req.user.tenantId,);
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete(':projectId/members/:userId')
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.projectMembersService.removeMember(
      projectId,
      userId,
      req.user.userId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':projectId/members/:userId/role')
  updateRole(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateMemberRoleDto,
    @Req() req: any,
  ) {
   return this.projectMembersService.updateRole(
     projectId,
     userId,
     body.role,
     req.user.userId,
   );
}
}