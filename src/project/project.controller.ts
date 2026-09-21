import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Req() req, @Body() body: CreateProjectDto) {
    return this.projectService.create(body, req.user.tenantId, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Req() req, @Body() body: UpdateProjectDto) {
    return this.projectService.updateProject(
      id,
      body,
      req.user.tenantId,
      req.user.userId,
    );
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req) {
    return this.projectService.deleteProject(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getAll(@Req() req) {
    return this.projectService.findAll(req.user.tenantId, req.user.userId);
  }

  @Get(':id/dashboard')
  @UseGuards(AuthGuard('jwt'))
  getDashboard(@Param('id') id: string, @Req() req) {
    return this.projectService.getDashboard(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }
}
