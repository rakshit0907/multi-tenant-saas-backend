import { Controller,Post,Get,Body,Req,UseGuards,Patch,Param,Delete, BadRequestException, UploadedFile, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Query,} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskPriority, TaskStatus, } from './task.entity';
import { AuthGuard } from '@nestjs/passport';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskCommentsService } from './task-comments.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';   
import { TaskAttachmentsService } from './task-attachments.service';
import { Res } from '@nestjs/common';
import { Response } from 'express';
import * as mime from 'mime-types';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';
import { LabelsService } from './labels.service';
@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(
    private tasksService: TasksService,
    private taskCommentsService: TaskCommentsService,
    private readonly taskAttachmentsService: TaskAttachmentsService,
    private readonly labelsService: LabelsService,
  ) {}
  
  @Post(':taskId/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
     storage: memoryStorage(),
     }),
 )
 uploadAttachment(
   @Param('taskId') taskId: string,
   @UploadedFile(
     new ParseFilePipe({
       validators: [
         new MaxFileSizeValidator({
           maxSize: 10 * 1024 * 1024,
         }),
         new FileTypeValidator({
          fileType:
          /(jpg|jpeg|png|webp|pdf|doc|docx|xls|xlsx|csv|txt|zip)$/,
         }),
       ],
     }),
   )
   file: Express.Multer.File,
   @Req() req: any,
 ) {
  const detectedMimeType = 
    mime.lookup(file.originalname) || file.mimetype || 'application/octet-stream';

  file.mimetype = detectedMimeType;
    
   return this.taskAttachmentsService.createAttachment(
     taskId,
     req.user.tenantId,
     req.user.userId,
     file,
   );
 }

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
      req.user.userId,
    );
  }

  @Post(':taskId/comments')
  addComment(
    @Param('taskId') taskId: string,
    @Body() body: { content: string },
    @Req() req: any,
  ) {
   return this.taskCommentsService.addComment(
     taskId,
     body.content,
     req.user.tenantId,
     req.user.userId,
   );
  }

  @Get(':taskId/comments')
  getComments(
    @Param('taskId') taskId: string,
    @Req() req: any,
  ) {
    return this.taskCommentsService.getComments(
      taskId,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Get(':taskId/attachments')
  getAttachments(
    @Param('taskId') taskId: string,
    @Req() req: any,
  ) {
   return this.taskAttachmentsService.getAttachments(
     taskId,
     req.user.tenantId,
     req.user.userId,
   );
  }

  @Get('attachments/:attachmentId/download')
  async downloadAttachment(
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const attachment =
       await this.taskAttachmentsService.getAttachment(
         attachmentId,
         req.user.tenantId,
         req.user.userId,
       );

    return res.download(
      attachment.filePath,
      attachment.originalName,
    );
  }

  @Delete('attachments/:attachmentId')
  deleteAttachment(
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
  ) {
   return this.taskAttachmentsService.deleteAttachment(
     attachmentId,
     req.user.tenantId,
     req.user.userId,
   );
 }

  @Delete('comments/:commentId')
  deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    return this.taskCommentsService.deleteComment(
      commentId,
      req.user.tenantId,
      req.user.userId,
    );
  }
  
  @Get('project/:projectId')
  getTasks(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Query() query: GetTasksQueryDto,
  ) {
   return this.tasksService.getTasks(
     projectId,
     req.user.tenantId,
     req.user.userId,
     query,
   );
 }
 
  @Get('project/:projectId/stats')
  getStats(
    @Param('projectId') projectId: string,
    @Req() req: any,
 ) {
   return this.tasksService.getStats(
    projectId,
    req.user.tenantId,
      req.user.userId,
  );
}
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
    @Req() req: any,
  ) {
    if (!body.status) {
      throw new BadRequestException('Status is required');
    }
    return this.tasksService.updateStatus(
      id,
      body.status,
      req.user.tenantId,
      req.user.userId,
    );
  }

  
  @Patch(':id')
  updateTask(
    @Param('id') id: string,
    @Body() body,
    @Req() req: any,
  ) {
    return this.tasksService.updateTask(id, body.title!, body.description ?? '', body.priority ?? TaskPriority.MEDIUM, req.user.tenantId, body.status, body.dueDate ? new Date(body.dueDate) : undefined, body.assigneeId, req.user.userId,
);

  }
  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Req() req: any,) {
    return this.tasksService.toggleComplete(id, req.user.tenantId, req.user.userId,);
}
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any,) {
    return this.tasksService.deleteTask(id, req.user.tenantId, req.user.userId,);
  }

  @Post('project/:projectId/labels')
  createLabel(
    @Param('projectId') projectId: string,
    @Body() body: {
      name: string;
      color?: string;
    },
    @Req() req: any,
 ) {
   return this.labelsService.createLabel(
     projectId,
     req.user.tenantId,
     req.user.userId,
     body.name,
     body.color,
   );
 }

 @Get('project/:projectId/labels')
 getLabels(
   @Param('projectId') projectId: string,
   @Req() req: any,
 ) {
   return this.labelsService.getLabels(
     projectId,
     req.user.tenantId,
     req.user.userId,
   );
 }

  @Get(':id')
  getTask(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.tasksService.getTask(id, req.user.tenantId,  req.user.userId,);
  }
}
