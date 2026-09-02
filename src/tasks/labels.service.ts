import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Label } from './label.entity';
import { Project } from '../project/project.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { ProjectRole } from '../common/enums/project-role.enum';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepo: Repository<Label>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
  ) {}

  private async getProject(
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

    return project;
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
        'Only project owners can manage labels',
      );
    }
  }

  private async getLabel(
  labelId: string,
  projectId: string,
) {
  const label = await this.labelRepo.findOne({
    where: {
      id: labelId,
      project: {
        id: projectId,
      },
    },
    relations: ['project'],
  });

  if (!label) {
    throw new NotFoundException(
      'Label not found',
    );
  }

  return label;
}

  async updateLabel(
  labelId: string,
  projectId: string,
  tenantId: string,
  userId: string,
  name?: string,
  color?: string,
) {
  await this.getProject(
    projectId,
    tenantId,
  );

  await this.verifyOwner(
    projectId,
    userId,
  );

  const label = await this.getLabel(
    labelId,
    projectId,
  );

  if (name !== undefined) {
    const cleanName = name.trim();

    if (!cleanName) {
      throw new BadRequestException(
        'Label name cannot be empty',
      );
    }

    const existing = await this.labelRepo
      .createQueryBuilder('label')
      .where('label.projectId = :projectId', {
        projectId,
      })
      .andWhere('LOWER(label.name) = LOWER(:name)', {
        name: cleanName,
      })
      .andWhere('label.id != :labelId', {
        labelId,
      })
      .getOne();

    if (existing) {
      throw new BadRequestException(
        'A label with this name already exists',
      );
    }

    label.name = cleanName;
  }

  if (color !== undefined) {
    label.color = color;
  }

  return this.labelRepo.save(label);
}

 async deleteLabel(
  labelId: string,
  projectId: string,
  tenantId: string,
  userId: string,
) {
  await this.getProject(
    projectId,
    tenantId,
  );

  await this.verifyOwner(
    projectId,
    userId,
  );

  const label = await this.getLabel(
    labelId,
    projectId,
  );

  await this.labelRepo.remove(label);

  return {
    message: 'Label deleted successfully',
  };
}

  async createLabel(
    projectId: string,
    tenantId: string,
    userId: string,
    name: string,
    color?: string,
  ) {
    const project = await this.getProject(
      projectId,
      tenantId,
    );

    await this.verifyOwner(
      projectId,
      userId,
    );

    const cleanName = name.trim();

    if (!cleanName) {
      throw new BadRequestException(
        'Label name is required',
      );
    }

    const existing = await this.labelRepo
      .createQueryBuilder('label')
      .where('label.projectId = :projectId', {
        projectId,
      })
      .andWhere('LOWER(label.name) = LOWER(:name)', {
        name: cleanName,
      })
      .getOne();

    if (existing) {
      throw new BadRequestException(
        'A label with this name already exists',
      );
    }

    const label = this.labelRepo.create({
      name: cleanName,
      color: color ?? '#6B7280',
      project,
    });

    return this.labelRepo.save(label);
  }

  async getLabels(
    projectId: string,
    tenantId: string,
    userId: string,
  ) {
    await this.getProject(
      projectId,
      tenantId,
    );

    await this.getMembership(
      projectId,
      userId,
    );

    return this.labelRepo.find({
      where: {
        project: {
          id: projectId,
        },
      },
      order: {
        name: 'ASC',
      },
    });
  }
}