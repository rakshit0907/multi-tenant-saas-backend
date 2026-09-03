import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../project/project.entity';
import { Task, TaskPriority, TaskStatus } from './task.entity';
import { User } from '../users/user.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/activity.entity';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.entity';
import { ProjectRole } from '../common/enums/project-role.enum';
import { Label } from './label.entity';
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private repo: Repository<Task>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Label)
    private labelRepo: Repository<Label>,

    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,

    private activityService: ActivityService,
    private notificationService: NotificationService,
    ) {}
  
 async toggleComplete(
  id: string,
  tenantId: string,
  userId?: string,
) {
  const task = await this.repo.findOne({
    where: { id, project: {
      tenant: {
        id: tenantId,
      },
    },
   },
    relations: ['project'],
  });

  if (!task) {
    return null;
  }

  if (!userId) {
     throw new ForbiddenException(
       'Authenticated user is required',
   );
 }

 const membership = await this.getMembership(
   task.project.id,
   userId,
 );

 if (
   membership.role !== ProjectRole.OWNER &&
   task.assignee?.id !== userId
 ) {
   throw new ForbiddenException(
     'You can only complete tasks assigned to you',
   );
 }

  task.completed = !task.completed;

  const savedTask = await this.repo.save(task);

  const user = await this.userRepo.findOne({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new NotFoundException('Updating user not found');
  }

  await this.activityService.log(
    ActivityAction.TASK_COMPLETED,
    task.project,
    user,
    savedTask,
   {
     completed: savedTask.completed,
   },
  );
   return savedTask;
}   

 async getTask(
  id: string,
  tenantId: string,
  userId?: string,
) {
  const task = await this.repo.findOne({
    where: {
      id,
      project: {
        tenant: {
          id: tenantId,
        },
      },
    },
    relations: [
      'assignee',
      'project',
      'labels',
    ],
  });

  if (!task) {
    throw new NotFoundException('Task not found');
  }

  if (!userId) {
    throw new ForbiddenException(
      'Authenticated user is required',
    );
  }

  await this.getMembership(
    task.project.id,
    userId,
  );

  return task;
}
  
  async getStats(
  projectId: string,
  tenantId: string,
  userId?: string,
) {
  const tasks = await this.getTasks(
    projectId,
    tenantId,
    userId,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const total = tasks.length;

  const todo = tasks.filter(
    (t) => t.status === TaskStatus.PENDING,
  ).length;

  const inProgress = tasks.filter(
    (t) => t.status === TaskStatus.IN_PROGRESS,
  ).length;

  const done = tasks.filter(
    (t) => t.status === TaskStatus.COMPLETED,
  ).length;

  const highPriority = tasks.filter(
    (t) => t.priority === TaskPriority.HIGH,
  ).length;

  const dueToday = tasks.filter((t) => {
    if (!t.dueDate) return false;

    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);

    return due.getTime() === today.getTime();
  }).length;

  const overdue = tasks.filter((t) => {
    if (!t.dueDate) return false;

    return (
      new Date(t.dueDate) < today &&
      t.status !== TaskStatus.COMPLETED
    );
  }).length;

  const completionPercentage =
    total === 0
      ? 0
      : Math.round((done / total) * 100);

  return {
    total,
    todo,
    inProgress,
    done,
    highPriority,
    dueToday,
    overdue,
    completionPercentage,
  };
}
  
   async createTask(
    title: string,
    description: string,
    projectId: string,
    tenantId: string,
    priority: TaskPriority,
    status: TaskStatus = TaskStatus.PENDING,
    dueDate?: Date,
    assigneeId?: string,
    createdById?: string,
    labelIds?: string[],
   )
  {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
        tenant: {
          id: tenantId,
        },
      },
      relations: ['tenant'],
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found or does not belong to your tenant',
      );
    }

    if (!createdById) {
      throw new ForbiddenException(
      'Authenticated user is required',
      );
    }

    await this.verifyOwner(
      projectId,
      createdById,
    );

    let assignee: User | null = null;

    if (assigneeId) {
      assignee = await this.userRepo.findOne({
        where: { id: assigneeId },
      });

      if (!assignee) {
        throw new NotFoundException("Assignee not found");
      }

      const membership = await this.memberRepo.findOne({
        where: {
          project: { id: projectId },
          user: { id: assigneeId },
        },
      });

      if (!membership) {
        throw new BadRequestException(
          "User is not a member of this project",
       );
     }
   }

   let labels: Label[] = [];

   if (labelIds !== undefined) {
     const uniqueLabelIds = [...new Set(labelIds)];

     if (uniqueLabelIds.length > 0) {
       labels = await this.labelRepo
         .createQueryBuilder('label')
         .innerJoin(
           'label.project',
           'project',
    )
      .where(
        'label.id IN (:...labelIds)',
        {
          labelIds: uniqueLabelIds,
        },
      )
      .andWhere(
        'project.id = :projectId',
        {
          projectId,
        },
      )
      .getMany();

    if (labels.length !== uniqueLabelIds.length) {
      throw new BadRequestException(
        'One or more labels are invalid for this project',
      );
    }
  }
}

   const task = this.repo.create({
    title,
    dueDate,
    priority,
    description,
    status,
    project,
    assignee: assignee ?? undefined,
    labels,
   });

   const savedTask = await this.repo.save(task);
   
   const creator = await this.userRepo.findOne({
    where: {
      id: createdById,
    },
   });

   if (!creator) {
    throw new NotFoundException('Creating user not found');
   }

    await this.activityService.log(
      ActivityAction.TASK_CREATED,
      project,
      creator,
      savedTask,
      {
        title: savedTask.title,
      },
    );
     if (assignee && assignee.id !== creator.id) {
       await this.notificationService.create(
         assignee,
         NotificationType.TASK_ASSIGNED,
         'New Task Assigned',
         `${creator.name} assigned "${savedTask.title}" to you`,
          project,
        {
          taskId: savedTask.id,
           projectId: project.id,
        },
     );
   }
   return savedTask;
  }

  async getTasks(
    projectId: string,
    tenantId: string,
    userId?: string,
    filters?: {
      search?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      labelId?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
        tenant: {
          id: tenantId,
        },
      },
      relations: ['tenant'],
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found or does not belong to your tenant',
      );
    }

    if (!userId) {
      throw new ForbiddenException(
      'Authenticated user is required',
    );
  }

  await this.getMembership(projectId, userId);

  const query = this.repo
  .createQueryBuilder('task')
  .leftJoinAndSelect('task.project', 'project')
  .leftJoinAndSelect('task.assignee', 'assignee')
  .leftJoinAndSelect('task.labels', 'labels')
  .leftJoin('project.tenant', 'tenant')
    .where('project.id = :projectId', {
      projectId,
    })
    .andWhere('tenant.id = :tenantId', {
      tenantId,
    });
    // Search title + description
    if (filters?.search?.trim()) {
      query.andWhere(
        `(
          task.title ILIKE :search
          OR task.description ILIKE :search
        )`,
        {
          search: `%${filters.search.trim()}%`,
        },
      );
    }

    if (filters?.labelId) {
      query.andWhere(
        'labels.id = :labelId',
      {
        labelId: filters.labelId,
      },
   );
  }

    // Status filter
    if (filters?.status) {
      query.andWhere(
        'task.status = :status',
        {
          status: filters.status,
        },
      );
    }

    //Priority filter
    if (filters?.priority) {
      query.andWhere(
        'task.priority = :priority',
        {
          priority: filters.priority,
        },
      );
    }

    //Assignee filter
    if (filters?.assigneeId) {
      query.andWhere(
        'assignee.id = :assigneeId',
        {
          assigneeId: filters.assigneeId,
        },
      );
    }

     const allowedSortFields: Record<string, string> = {
       dueDate: 'task.dueDate',
       title: 'task.title',
       status: 'task.status',
       priority: 'task.priority',
    };

    const sortColumn =
      allowedSortFields[filters?.sortBy ?? ''] ??
      'task.dueDate';

    const sortOrder =
      filters?.sortOrder === 'DESC'
        ? 'DESC'
        : 'ASC';

    query.orderBy(
      sortColumn,
      sortOrder,
      'NULLS LAST',
    );

    return query.getMany();
  } 

  async updateTask(
    id: string,
    title: string,
    description: string,
    priority: TaskPriority,
    tenantId: string,
    status?: TaskStatus,
    dueDate?: Date,
    assigneeId?: string,
    userId?: string,
    labelIds?: string[],
  ) {

    const task = await this.repo.findOne({
      where: { id,
        project: {
          tenant: {
            id: tenantId,
          },
        },
       },
      relations: ['project', 'assignee', 'labels',],
    });

    if (!task) {
      return null;
    }

    if (!userId) {
      throw new ForbiddenException(
      'Authenticated user is required',
    );
  }

  await this.verifyOwner(
    task.project.id,
    userId,
  );

    const oldPriority = task.priority;
    const oldStatus = task.status;
    const oldAssigneeId = task.assignee?.id;
    const oldAssigneeName = task.assignee?.name ?? null;

    task.title = title;
    task.description = description;
    task.priority = priority;
    if (status !== undefined) {
      task.status = status;

    }
    

    if (dueDate !== undefined) {
      task.dueDate = dueDate;
    }

    if (assigneeId !== undefined) {
      if (assigneeId === '') {
        task.assignee = undefined;
      } else {
        const assignee = await this.userRepo.findOne({
          where: { id: assigneeId },
        });

        if (!assignee) {
          throw new NotFoundException('Assignee not found');
        }

        const membership = await this.memberRepo.findOne({
          where: {
            project: { id: task.project.id },
            user: { id: assigneeId },
          },
        });

        if (!membership) {
          throw new BadRequestException(
            'User is not a member of this project',
          );
        }

        task.assignee = assignee;
      }
    }
    const savedTask = await this.repo.save(task);

    const user = await this.userRepo.findOne({
      where: {
        id: userId,
    },
  });

  if (!user) {
    throw new NotFoundException('Updating user not found');
  }

// General task update
  await this.activityService.log(
    ActivityAction.TASK_UPDATED,
    task.project,
    user,
    savedTask,
   {
     title: savedTask.title,
   },
 );

// Status changed
 // Status changed
if (oldStatus !== task.status) {
  await this.activityService.log(
    ActivityAction.TASK_STATUS_CHANGED,
    task.project,
    user,
    savedTask,
    {
      oldStatus,
      newStatus: task.status,
    },
  );

  if (
    savedTask.assignee &&
    savedTask.assignee.id !== user.id
  ) {
    const notificationType =
        savedTask.status === TaskStatus.COMPLETED
            ? NotificationType.TASK_COMPLETED
            : NotificationType.TASK_STATUS_CHANGED;

    const title =
        savedTask.status === TaskStatus.COMPLETED
            ? 'Task Completed'
            : 'Task Status Changed';

    const message =
        savedTask.status === TaskStatus.COMPLETED
            ? `${user.name} completed "${savedTask.title}"`
            : `${user.name} changed "${savedTask.title}" from ${oldStatus} to ${savedTask.status}`;

    await this.notificationService.create(
      savedTask.assignee,
      notificationType,
      title,
      message,
      task.project,
      {
        taskId: savedTask.id,
        projectId: task.project.id,
        oldStatus,
        newStatus: savedTask.status,
      },
    );
  }
}

// Priority changed
  if (oldPriority !== task.priority) {
    await this.activityService.log(
      ActivityAction.TASK_PRIORITY_CHANGED,
      task.project,
      user,
      savedTask,
    {
       oldPriority,
       newPriority: task.priority,
     },
   );
  }

// Assignee changed
  const newAssigneeId = savedTask.assignee?.id;

if (oldAssigneeId !== newAssigneeId) {
  let newAssignee: User | null = null;

  if (newAssigneeId) {
    newAssignee = await this.userRepo.findOne({
      where: {
        id: newAssigneeId,
      },
    });
  }

  await this.activityService.log(
    ActivityAction.TASK_ASSIGNED,
    task.project,
    user,
    savedTask,
    {
      oldAssigneeId: oldAssigneeId ?? null,
      newAssigneeId: newAssigneeId ?? null,
      oldAssigneeName,
      newAssigneeName: newAssignee?.name ?? null,
    },
  );

  if (newAssignee && newAssignee.id !== user.id) {
    await this.notificationService.create(
      newAssignee,
      NotificationType.TASK_ASSIGNED,
      'Task Assigned',
      `${user.name} assigned "${savedTask.title}" to you`,
      task.project,
      {
        taskId: savedTask.id,
        projectId: task.project.id,
      },
    );
  }
 }

      
   return savedTask;
 }


  async updateStatus(
    id: string,
    status: TaskStatus,
    tenantId: string,
    userId?: string,
  ) {
    const task = await this.repo.findOne({
      where: { id, project: {
        tenant: {
          id: tenantId,
        },
      },
    },  
      relations: ['project', 'assignee'],
    });

    if (!task) {
       return null;
     }

     if (!userId) {
       throw new ForbiddenException(
         'Authenticated user is required',
     );
   }

   const membership = await this.getMembership(
     task.project.id,
     userId,
   );

  if (
    membership.role !== ProjectRole.OWNER &&
    task.assignee?.id !== userId
  ) {
   throw new ForbiddenException(
     'You can only update tasks assigned to you',
   );
 }

     const oldStatus = task.status;

     if (status !== undefined) {
      task.status = status;
     }
    

     const savedTask = await this.repo.save(task);

     const user = await this.userRepo.findOne({
       where: {
       id: userId,
     },
   });

  if (!user) {
    throw new NotFoundException('Updating user not found');
  }

  if (oldStatus !== savedTask.status) {
    await this.activityService.log(
      ActivityAction.TASK_STATUS_CHANGED,
      task.project,
      user,
      savedTask,
     {
       oldStatus,
       newStatus: savedTask.status,
     },
   );
 }

 return savedTask;
}

  async deleteTask(
  id: string,
  tenantId: string,
  userId?: string,
) {
  const task = await this.repo.findOne({
    where: { id, project: {
      tenant: {
        id: tenantId,
      },
    },
   },
    relations: ['project'],
  });

   if (!task) {
     return null;
  }


  if (!userId) {
  throw new ForbiddenException(
    'Authenticated user is required',
  );
 }

 await this.verifyOwner(
   task.project.id,
   userId,
 );


  const user = await this.userRepo.findOne({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new NotFoundException('Deleting user not found');
  }

  await this.activityService.log(
    ActivityAction.TASK_DELETED,
    task.project,
    user,
    task,
   {
     title: task.title,
   },
 );

 return this.repo.remove(task);
}

private async getMembership(
  projectId: string,
  userId: string,
) {
  const membership = await this.memberRepo.findOne({
    where: {
      project: {
        id: projectId,
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

  return membership;
}

private async verifyOwner(
  projectId: string,
  userId: string,
) {
  const membership = await this.getMembership(
    projectId,
    userId,
  );

  if (membership.role !== ProjectRole.OWNER) {
    throw new ForbiddenException(
      'Only project owners can perform this action',
    );
  }

  return membership;
}
}