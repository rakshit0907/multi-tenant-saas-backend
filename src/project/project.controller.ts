import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Req() req, @Body() body) {
    console.log("BODY:", body);
    console.log("USER:", req.user);
    console.log("REQ TENANT:", req['tenantId']);
    return this.projectService.create(
      body.name,
      req.user?.tenantId
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  getAll(@Req() req) {
    return this.projectService.findAll(req.user.tenantId);
  }
}