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
} from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/activity.entity';
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private repo: Repository<Task>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,

    private activityService: ActivityService,
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

  task.completed = !task.completed;

  const savedTask = await this.repo.save(task);

  if (userId) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (user) {
      await this.activityService.log(
        ActivityAction.TASK_COMPLETED,
        task.project,
        user,
        savedTask,
        {
          completed: savedTask.completed,
        },
      );
    }
  }

  return savedTask;
}   

 async getTask(id: string, tenantId: string) {
  return this.repo.findOne({
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
    ],
  });
 }
  
  async getStats(
  projectId: string,
  tenantId: string,
) {
  const tasks = await this.getTasks(
    projectId,
    tenantId,
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

   const task = this.repo.create({
    title,
    dueDate,
    priority,
    description,
    status,
    project,
    assignee: assignee ?? undefined,
   });

   const savedTask = await this.repo.save(task);

   if (createdById) {
     const creator = await this.userRepo.findOne({
       where: { id: createdById },
     });

     if (creator) {
       await this.activityService.log(
         ActivityAction.TASK_CREATED,
         project,
         creator,
         savedTask,
         {
           title: savedTask.title,
         },
       );
     }
   }

   return savedTask;
  }

  async getTasks(
    projectId: string,
    tenantId: string,
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

    return this.repo.find({
      where: {
        project: {
          id: projectId,
          tenant: {
            id: tenantId,
          },
        },
      },
      relations: ['project', 'assignee'],
    });
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
  ) {

    const task = await this.repo.findOne({
      where: { id,
        project: {
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

    const oldPriority = task.priority;
    const oldStatus = task.status;
    const oldAssigneeId = task.assignee?.id;

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

    if (userId) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      });

      if (user) {
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
        if (status !== undefined && oldStatus !== task.status) {
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
       }

      // Priority changed
       if (oldPriority !== priority) {
         await this.activityService.log(
           ActivityAction.TASK_PRIORITY_CHANGED,
           task.project,
           user,
           savedTask,
           {
             oldPriority,
             newPriority: priority,
           },
         );
       }

      // Assignee changed
       const newAssigneeId = savedTask.assignee?.id;

       if (oldAssigneeId !== newAssigneeId) {
         await this.activityService.log(
           ActivityAction.TASK_ASSIGNED,
           task.project,
           user,
           savedTask,
           {
             oldAssigneeId: oldAssigneeId ?? null,
             newAssigneeId: newAssigneeId ?? null,
           },
         );
       }
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

     const oldStatus = task.status;

     if (status !== undefined) {
      task.status = status;
     }
    

     const savedTask = await this.repo.save(task);

     if (userId && oldStatus !== status) {
       const user = await this.userRepo.findOne({
         where: { id: userId },
     });

     if (user) {
       await this.activityService.log(
         ActivityAction.TASK_STATUS_CHANGED,
         task.project,
         user,
         savedTask,
        {
          oldStatus,
          newStatus: status,
        },
      );
    }
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

  if (userId) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (user) {
      await this.activityService.log(
        ActivityAction.TASK_DELETED,
        task.project,
        user,
        task,
        {
          title: task.title,
        },
      );
    }
  }

  return this.repo.remove(task);
}
}