import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MilestoneService } from './milestone.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Controller('projects/:projectId/milestones')
@UseGuards(AuthGuard('jwt'))
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
    @Req() req,
  ) {
    return this.milestoneService.create(
      projectId,
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  @Get()
  findAll(@Param('projectId') projectId: string, @Req() req) {
    return this.milestoneService.findAll(
      projectId,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Patch(':milestoneId')
  update(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
    @Req() req,
  ) {
    return this.milestoneService.update(
      projectId,
      milestoneId,
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  @Delete(':milestoneId')
  remove(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Req() req,
  ) {
    return this.milestoneService.remove(
      projectId,
      milestoneId,
      req.user.tenantId,
      req.user.userId,
    );
  }
}
