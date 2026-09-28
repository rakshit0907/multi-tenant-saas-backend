import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantService } from './tenant.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { CreateWorkspaceInviteDto } from './dto/create-workspace-invite.dto';
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
}
