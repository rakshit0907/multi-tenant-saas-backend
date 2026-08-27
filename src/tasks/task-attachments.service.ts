import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import { TaskAttachment } from './task-attachment.entity';
import { Task } from './task.entity';
import { User } from '../users/user.entity';
import { ProjectMember } from '../project-members/project-member.entity';

@Injectable()
export class TaskAttachmentsService {
  constructor(
    @InjectRepository(TaskAttachment)
    private readonly attachmentRepo: Repository<TaskAttachment>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
  ) {}

  private async getAuthorizedTask(
    taskId: string,
    tenantId: string,
    userId: string,
  ) {
    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,
        project: {
          tenant: {
            id: tenantId,
          },
        },
      },
      relations: ['project', 'project.tenant'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const membership = await this.memberRepo.findOne({
      where: {
        project: {
          id: task.project.id,
        },
        user: {
          id: userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this project',
      );
    }

    return task;
  }

  async createAttachment(
    taskId: string,
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const task = await this.getAuthorizedTask(
      taskId,
      tenantId,
      userId,
    );

    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const attachment = this.attachmentRepo.create({
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
      task,
      uploadedBy: user,
    });

    return this.attachmentRepo.save(attachment);
  }

  async getAttachments(
    taskId: string,
    tenantId: string,
    userId: string,
  ) {
    await this.getAuthorizedTask(
      taskId,
      tenantId,
      userId,
    );

    return this.attachmentRepo.find({
      where: {
        task: {
          id: taskId,
        },
      },
      relations: ['uploadedBy'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getAttachment(
    attachmentId: string,
    tenantId: string,
    userId: string,
  ) {
    const attachment = await this.attachmentRepo.findOne({
      where: {
        id: attachmentId,
      },
      relations: [
        'task',
        'task.project',
        'task.project.tenant',
        'uploadedBy',
      ],
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.task.project.tenant.id !== tenantId) {
      throw new NotFoundException('Attachment not found');
    }

    const membership = await this.memberRepo.findOne({
      where: {
        project: {
          id: attachment.task.project.id,
        },
        user: {
          id: userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this project',
      );
    }

    return attachment;
  }

  async deleteAttachment(
    attachmentId: string,
    tenantId: string,
    userId: string,
  ) {
    const attachment = await this.getAttachment(
      attachmentId,
      tenantId,
      userId,
    );

    try {
        await fs.unlink(attachment.filePath);
    } catch (_) {
        // Ignore if file is already missing.
    }

    // For now this removes the database record.
    // Physical file deletion will be handled with storage logic.
    await this.attachmentRepo.remove(attachment);

    return {
      message: 'Attachment deleted successfully',
    };
  }
}