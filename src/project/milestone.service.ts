import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Milestone } from './milestone.entity';
import { Project } from './project.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { ProjectRole } from '../common/enums/project-role.enum';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { TaskStatus } from '../tasks/task.entity';

@Injectable()
export class MilestoneService {
  constructor(
    @InjectRepository(Milestone)
    private milestoneRepo: Repository<Milestone>,

    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,
  ) {}

  private async getProject(projectId: string, tenantId: string) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
        tenant: {
          id: tenantId,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async getMembership(projectId: string, userId: string) {
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

    return membership;
  }

  private async requireOwner(projectId: string, userId: string) {
    const membership = await this.getMembership(projectId, userId);

    if (membership.role !== ProjectRole.OWNER) {
      throw new ForbiddenException(
        'Only the project owner can manage milestones',
      );
    }

    return membership;
  }

  async create(
    projectId: string,
    tenantId: string,
    userId: string,
    dto: CreateMilestoneDto,
  ) {
    const project = await this.getProject(projectId, tenantId);

    await this.requireOwner(projectId, userId);

    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Milestone name is required');
    }

    const milestone = this.milestoneRepo.create({
      name,
      description: dto.description?.trim() || null,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
      project,
    });

    return this.milestoneRepo.save(milestone);
  }

  async findAll(projectId: string, tenantId: string, userId: string) {
    await this.getProject(projectId, tenantId);
    await this.getMembership(projectId, userId);

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

    return milestones.map((milestone) => {
      const taskCount = milestone.tasks.length;

      const completedTaskCount = milestone.tasks.filter(
        (task) => task.status === TaskStatus.COMPLETED,
      ).length;

      const progress =
        taskCount === 0
          ? 0
          : Math.round((completedTaskCount / taskCount) * 100);

      const { tasks, ...milestoneData } = milestone;

      return {
        ...milestoneData,
        taskCount,
        completedTaskCount,
        progress,
      };
    });
  }

  async update(
    projectId: string,
    milestoneId: string,
    tenantId: string,
    userId: string,
    dto: UpdateMilestoneDto,
  ) {
    await this.getProject(projectId, tenantId);
    await this.requireOwner(projectId, userId);

    const milestone = await this.milestoneRepo.findOne({
      where: {
        id: milestoneId,
        project: {
          id: projectId,
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new BadRequestException('Milestone name is required');
      }

      milestone.name = name;
    }

    if (dto.description !== undefined) {
      milestone.description = dto.description.trim() || null;
    }

    if (dto.targetDate !== undefined) {
      milestone.targetDate = new Date(dto.targetDate);
    }

    if (dto.status !== undefined) {
      milestone.status = dto.status;
    }

    return this.milestoneRepo.save(milestone);
  }

  async remove(
    projectId: string,
    milestoneId: string,
    tenantId: string,
    userId: string,
  ) {
    await this.getProject(projectId, tenantId);
    await this.requireOwner(projectId, userId);

    const milestone = await this.milestoneRepo.findOne({
      where: {
        id: milestoneId,
        project: {
          id: projectId,
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    await this.milestoneRepo.remove(milestone);

    return {
      message: 'Milestone deleted successfully',
    };
  }
}
