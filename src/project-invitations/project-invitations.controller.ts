import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ProjectInvitationsService } from './project-invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Controller('project-invitations')
@UseGuards(AuthGuard('jwt'))
export class ProjectInvitationsController {
  constructor(
    private readonly invitationService: ProjectInvitationsService,
  ) {}

  @Post('projects/:projectId')
  createInvitation(
    @Param('projectId') projectId: string,
    @Body() body: CreateInvitationDto,
    @Req() req: any,
  ) {
    return this.invitationService.createInvitation(
      projectId,
      body.userId,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Get('mine')
  getMyInvitations(@Req() req: any) {
    return this.invitationService.getMyInvitations(
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Patch(':invitationId/accept')
  acceptInvitation(
    @Param('invitationId') invitationId: string,
    @Req() req: any,
  ) {
    return this.invitationService.acceptInvitation(
      invitationId,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Patch(':invitationId/reject')
  rejectInvitation(
    @Param('invitationId') invitationId: string,
    @Req() req: any,
  ) {
    return this.invitationService.rejectInvitation(
      invitationId,
      req.user.userId,
      req.user.tenantId,
    );
  }
}