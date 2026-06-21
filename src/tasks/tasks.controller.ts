import { Controller,Post,Get,Body,Req,UseGuards,Patch,Param,Delete,} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post('project/:projectId')
  create(
    @Param('projectId') projectId: string,
    @Body() body,
    @Req() req: any,) {
    return this.tasksService.createTask(
      body.title,
      projectId,
      req.user.tenantId,
    );
  }

  @Get('project/:projectId')
  getTasks(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.tasksService.getTasks(projectId, req.user.tenantId,);   
  }
  @Get('project/:projectId/stats')
getStats(
  @Param('projectId') projectId: string,
  @Req() req: any,
) {
  return this.tasksService.getStats(
    projectId,
    req.user.tenantId,
  );
}
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body,
  ) {
    return this.tasksService.updateTask(id, body.title);
  }
  @Patch(':id/toggle')
toggle(@Param('id') id: string) {
  return this.tasksService.toggleComplete(id);
}
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tasksService.deleteTask(id);
  }
}