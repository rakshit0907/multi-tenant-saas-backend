import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import { extname, join } from 'path';
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
  // Authorization happens BEFORE anything is written to disk.
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

  const uploadDirectory = join(
    'uploads',
    'task-attachments',
  );

  await fs.mkdir(uploadDirectory, {
    recursive: true,
  });

  const uniqueName =
    `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  const fileName =
    `${uniqueName}${extname(file.originalname)}`;

  const filePath = join(
    uploadDirectory,
    fileName,
  );

  await fs.writeFile(
    filePath,
    file.buffer,
  );

  try {
    const attachment = this.attachmentRepo.create({
      originalName: file.originalname,
      fileName,
      filePath,
      mimeType: file.mimetype,
      size: file.size,
      task,
      uploadedBy: user,
    });

    return await this.attachmentRepo.save(
      attachment,
    );
  } catch (error) {
    // DB save failed, so don't leave an orphan physical file.
    try {
      await fs.unlink(filePath);
    } catch (_) {}

    throw error;
  }
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
    const attachment = await this.attachmentRepo
      .createQueryBuilder('attachment')
      .addSelect('attachment.filePath')
      .leftJoinAndSelect('attachment.task', 'task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('project.tenant', 'tenant')
      .leftJoinAndSelect('attachment.uploadedBy', 'uploadedBy')
      .where('attachment.id = :attachmentId', {
        attachmentId,
      })
       .getOne();

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

  const isOwner = membership.role === 'OWNER';

  const isUploader =
    attachment.uploadedBy.id === userId;

  if (!isOwner && !isUploader) {
    throw new ForbiddenException(
      'You do not have permission to delete this attachment',
    );
  }

  try {
    await fs.unlink(attachment.filePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  await this.attachmentRepo.remove(attachment);

  return {
    message: 'Attachment deleted successfully',
  };
}
}