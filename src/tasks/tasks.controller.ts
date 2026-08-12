import { Controller,Post,Get,Body,Req,UseGuards,Patch,Param,Delete,} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskPriority } from './task.entity';
import { AuthGuard } from '@nestjs/passport';
import { UpdateTaskDto } from './dto/update-task.dto';
@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post('project/:projectId')
  createTask(
    @Param('projectId') projectId: string,
    @Body() body: any,
    @Req() req: any,) {
    return this.tasksService.createTask(
      body.title,
      body.description ?? '',
      projectId,
      req.user.tenantId,
      body.priority ?? TaskPriority.MEDIUM,
      body.status,
      body.dueDate ? new Date(body.dueDate) : undefined,
      body.assigneeId,
      req.user.id,
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
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.updateStatus(
      id,
      body.status,
      req.user.tenantId,
      req.user.id,
    );
  }

  
  @Patch(':id')
  updateTask(
    @Param('id') id: string,
    @Body() body,
    @Req() req: any,
  ) {
    return this.tasksService.updateTask(id, body.title!, body.description ?? '', body.priority ?? TaskPriority.MEDIUM, body.status, body.dueDate ? new Date(body.dueDate) : undefined, body.assigneeId, req.user.id,);
  }
  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Req() req: any,) {
    return this.tasksService.toggleComplete(id, req.user.tenantId, req.user.id,);
}
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any,) {
    return this.tasksService.deleteTask(id, req.user.tenantId, req.user.id,);
  }

  @Get(':id')
  getTask(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.tasksService.getTask(id, req.user.tenantId,);
  }
}
