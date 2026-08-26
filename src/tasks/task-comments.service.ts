import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TaskComment } from './task-comment.entity';
import { Task } from './task.entity';
import { User } from '../users/user.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { ProjectRole } from '../common/enums/project-role.enum';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectRepository(TaskComment)
    private readonly commentRepo: Repository<TaskComment>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
  ) {}

  private async getTaskAndVerifyMember(
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
      relations: ['project'],
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

    return {
      task,
      membership,
    };
  }

  async addComment(
    taskId: string,
    content: string,
    tenantId: string,
    userId: string,
  ) {
    const trimmedContent = content?.trim();

    if (!trimmedContent) {
      throw new BadRequestException(
        'Comment cannot be empty',
      );
    }

    const { task } = await this.getTaskAndVerifyMember(
      taskId,
      tenantId,
      userId,
    );

    const author = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!author) {
      throw new NotFoundException('User not found');
    }

    const comment = this.commentRepo.create({
      content: trimmedContent,
      task,
      author,
    });

    return this.commentRepo.save(comment);
  }

  async getComments(
    taskId: string,
    tenantId: string,
    userId: string,
  ) {
    await this.getTaskAndVerifyMember(
      taskId,
      tenantId,
      userId,
    );

    return this.commentRepo.find({
      where: {
        task: {
          id: taskId,
        },
      },
      relations: ['author'],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async deleteComment(
    commentId: string,
    tenantId: string,
    userId: string,
  ) {
    const comment = await this.commentRepo.findOne({
      where: {
        id: commentId,
        task: {
          project: {
            tenant: {
              id: tenantId,
            },
          },
        },
      },
      relations: [
        'author',
        'task',
        'task.project',
      ],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const membership = await this.memberRepo.findOne({
      where: {
        project: {
          id: comment.task.project.id,
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

    const isAuthor = comment.author.id === userId;
    const isOwner =
        membership.role === ProjectRole.OWNER;

    if (!isAuthor && !isOwner) {
      throw new ForbiddenException(
        'You can only delete your own comments',
      );
    }

    await this.commentRepo.remove(comment);

    return {
      message: 'Comment deleted successfully',
    };
  }
}