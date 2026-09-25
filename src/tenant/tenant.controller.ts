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
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('invite')
  createInvite(@Body('email') email: string, @Req() req) {
    return this.tenantService.createInvite(req.user.tenantId, email);
  }

  @Post('accept-invite')
  acceptInvite(@Body() body: AcceptInviteDto) {
    return this.tenantService.acceptInvite(
      body.token,
      body.name,
      body.password,
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
