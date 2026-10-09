import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantService } from './tenant.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { CreateWorkspaceInviteDto } from './dto/create-workspace-invite.dto';
import { UpdateWorkspaceMemberRoleDto } from './dto/update-workspace-member-role.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('invite')
  createInvite(@Body() body: CreateWorkspaceInviteDto, @Req() req) {
    return this.tenantService.createInvite(
      req.user.userId,
      req.user.tenantId,
      body.email,
      body.role,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('users')
  getOrganizationUsers(@Req() req) {
    return this.tenantService.getOrganizationUsers(req.user.tenantId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('members/:userId/role')
  updateWorkspaceMemberRole(
    @Param('userId') targetUserId: string,
    @Body() body: UpdateWorkspaceMemberRoleDto,
    @Req() req,
  ) {
    return this.tenantService.updateWorkspaceMemberRole(
      req.user.userId,
      req.user.tenantId,
      targetUserId,
      body.role,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('members/:userId')
  removeWorkspaceMember(@Param('userId') targetUserId: string, @Req() req) {
    return this.tenantService.removeWorkspaceMember(
      req.user.userId,
      req.user.tenantId,
      targetUserId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('workspaces')
  getWorkspaces(@Req() req) {
    return this.tenantService.getUserWorkspaces(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('workspaces/:tenantId/switch')
  switchWorkspace(@Param('tenantId') tenantId: string, @Req() req) {
    return this.tenantService.switchWorkspace(
      req.user.userId,
      tenantId,
      req.user.role,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('workspaces')
  createWorkspace(@Req() req, @Body() body: CreateWorkspaceDto) {
    return this.tenantService.createWorkspace(req.user.userId, body.name);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('workspace')
  updateWorkspace(@Req() req, @Body() body: UpdateWorkspaceDto) {
    return this.tenantService.updateWorkspace(
      req.user.userId,
      req.user.tenantId,
      body.name,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('invites/:invitationId/accept')
  acceptWorkspaceInviteById(
    @Param('invitationId') invitationId: string,
    @Req() req,
  ) {
    return this.tenantService.acceptInviteForExistingUserById(
      req.user.userId,
      invitationId,
    );
  }
}
