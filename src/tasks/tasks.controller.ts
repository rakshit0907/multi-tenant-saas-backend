import { Controller,Post,Get,Body,Req,UseGuards,Patch,Param,Delete,} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskPriority } from './task.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post('project/:projectId')
  createTask(
    @Param('projectId') projectId: string,
    @Body() body,
    @Req() req: any,) {
    return this.tasksService.createTask(
      body.title,
      body.description,
      projectId,
      req.user.tenantId,
      body.priority ?? TaskPriority.MEDIUM,
      body.dueDate,
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
  updateTask(
    @Param('id') id: string,
    @Body() body,
  ) {
    return this.tasksService.updateTask(id, body.title, body.description, body.priority ?? TaskPriority.MEDIUM, body.dueDate);
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