import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectMember } from '../project-members/project-member.entity';
import { ProjectRole } from '../common/enums/project-role.enum';
import { TaskPriority, TaskStatus } from '../tasks/task.entity';
import { Task } from '../tasks/task.entity';
import { ActivityService } from '../activity/activity.service';
import { Milestone } from './milestone.entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private repo: Repository<Project>,

    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,

    @InjectRepository(Task)
    private taskRepo: Repository<Task>,

    @InjectRepository(Milestone)
    private milestoneRepo: Repository<Milestone>,

    private activityService: ActivityService,
  ) {}

  async create(dto: CreateProjectDto, tenantId: string, userId: string) {
    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Project name is required');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : null;
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    if (startDate && dueDate && startDate > dueDate) {
      throw new BadRequestException(
        'Project start date cannot be after due date',
      );
    }

    const project = this.repo.create({
      name,
      description: dto.description?.trim() || null,
      status: dto.status ?? ProjectStatus.PLANNING,
      startDate,
      dueDate,
      tenant: { id: tenantId },
    });

    const savedProject = await this.repo.save(project);

    await this.memberRepo.save({
      project: savedProject,
      user: { id: userId },
      role: ProjectRole.OWNER,
    });

    return savedProject;
  }

  async updateProject(
    id: string,
    dto: UpdateProjectDto,
    tenantId: string,
    userId: string,
  ) {
    const project = await this.repo.findOne({
      where: {
        id,
        tenant: { id: tenantId },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.memberRepo.findOne({
      where: {
        project: { id },
        user: { id: userId },
      },
    });

    if (!membership || membership.role !== ProjectRole.OWNER) {
      throw new ForbiddenException(
        'Only the project owner can update this project',
      );
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new BadRequestException('Project name is required');
      }

      project.name = name;
    }

    if (dto.description !== undefined) {
      project.description =
        dto.description === null ? null : dto.description.trim() || null;
    }

    if (dto.status !== undefined) {
      project.status = dto.status;
    }

    if (dto.startDate !== undefined) {
      project.startDate =
        dto.startDate === null ? null : new Date(dto.startDate);
    }

    if (dto.dueDate !== undefined) {
      project.dueDate = dto.dueDate === null ? null : new Date(dto.dueDate);
    }

    if (
      project.startDate &&
      project.dueDate &&
      project.startDate > project.dueDate
    ) {
      throw new BadRequestException(
        'Project start date cannot be after due date',
      );
    }

    return this.repo.save(project);
  }
  async deleteProject(id: string, tenantId: string, userId: string) {
    const project = await this.repo.findOne({
      where: {
        id,
        tenant: {
          id: tenantId,
        },
      },
      relations: ['tenant'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.memberRepo.findOne({
      where: {
        project: { id },
        user: { id: userId },
      },
    });

    if (!membership || membership.role !== ProjectRole.OWNER) {
      throw new ForbiddenException(
        'Only the project owner can delete this project',
      );
    }

    await this.repo.remove(project);

    return {
      message: 'Project deleted successfully',
    };
  }
  async findAll(tenantId: string, userId: string) {
    const memberships = await this.memberRepo.find({
      where: {
        user: { id: userId },
        project: {
          tenant: { id: tenantId },
        },
      },
      relations: ['project'],
    });

    return memberships.map((m) => m.project);
  }

  async getDashboard(projectId: string, tenantId: string, userId: string) {
    const project = await this.repo.findOne({
      where: {
        id: projectId,
        tenant: {
          id: tenantId,
        },
      },
      relations: ['tenant'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

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
      throw new ForbiddenException('You are not a member of this project');
    }

    const tasks = await this.taskRepo.find({
      where: {
        project: {
          id: projectId,
        },
      },
      relations: ['assignee'],
    });

    const milestones = await this.milestoneRepo.find({
      where: {
        project: {
          id: projectId,
        },
      },
      relations: {
        tasks: true,
      },
      order: {
        targetDate: 'ASC',
        createdAt: 'ASC',
      },
    });

    const milestoneSummaries = milestones.map((milestone) => {
      const taskCount = milestone.tasks.length;

      const completedTaskCount = milestone.tasks.filter(
        (task) => task.status === TaskStatus.COMPLETED,
      ).length;

      const progress =
        taskCount === 0
          ? 0
          : Math.round((completedTaskCount / taskCount) * 100);

      return {
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        targetDate: milestone.targetDate,
        status: milestone.status,
        taskCount,
        completedTaskCount,
        progress,
      };
    });

    const total = tasks.length;

    const pending = tasks.filter(
      (task: any) => task.status === TaskStatus.PENDING,
    ).length;

    const inProgress = tasks.filter(
      (task: any) => task.status === TaskStatus.IN_PROGRESS,
    ).length;

    const completed = tasks.filter(
      (task: any) => task.status === TaskStatus.COMPLETED,
    ).length;

    const low = tasks.filter(
      (task: any) => task.priority === TaskPriority.LOW,
    ).length;

    const medium = tasks.filter(
      (task: any) => task.priority === TaskPriority.MEDIUM,
    ).length;

    const high = tasks.filter(
      (task: any) => task.priority === TaskPriority.HIGH,
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueToday = tasks.filter((task: any) => {
      if (!task.dueDate) return false;

      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);

      return due.getTime() === today.getTime();
    }).length;

    const overdue = tasks.filter((task: any) => {
      if (!task.dueDate) return false;

      return (
        new Date(task.dueDate) < today && task.status !== TaskStatus.COMPLETED
      );
    }).length;

    const upcomingDeadlines = tasks
      .filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) >= today &&
          task.status !== TaskStatus.COMPLETED,
      )
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )
      .slice(0, 5)
      .map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        assignee: task.assignee
          ? {
              id: task.assignee.id,
              name: task.assignee.name,
            }
          : null,
      }));

    const completionPercentage =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    const members = await this.memberRepo.count({
      where: {
        project: {
          id: projectId,
        },
      },
    });

    const projectMembers = await this.memberRepo.find({
      where: {
        project: {
          id: projectId,
        },
      },
      relations: ['user'],
    });

    const workload = projectMembers.map((member) => {
      const assignedTasks = tasks.filter(
        (task) => task.assignee?.id === member.user.id,
      );

      return {
        userId: member.user.id,
        name: member.user.name,
        total: assignedTasks.length,

        completed: assignedTasks.filter(
          (task) => task.status === TaskStatus.COMPLETED,
        ).length,

        inProgress: assignedTasks.filter(
          (task) => task.status === TaskStatus.IN_PROGRESS,
        ).length,

        pending: assignedTasks.filter(
          (task) => task.status === TaskStatus.PENDING,
        ).length,
      };
    });

    const recentActivity = await this.activityService.getProjectActivity(
      projectId,
      tenantId,
      10,
    );

    return {
      project: {
        id: project.id,
        name: project.name,
        createdAt: project.created_at,
      },

      tasks: {
        total,
        pending,
        inProgress,
        completed,
        overdue,
        dueToday,
        completionPercentage,
      },

      priority: {
        low,
        medium,
        high,
      },

      members: {
        total: members,
      },
      workload,
      upcomingDeadlines,
      milestones: milestoneSummaries,
      recentActivity,
    };
  }
}
