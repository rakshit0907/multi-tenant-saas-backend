import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { Label } from './label.entity';
import { Milestone } from '../project/milestone.entity';
import { ActivityService } from '../activity/activity.service';
import { NotificationService } from '../notifications/notification.service';
import { TaskAttachmentsService } from './task-attachments.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Project),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Label),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Milestone),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ProjectMember),
          useValue: {},
        },
        {
          provide: ActivityService,
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: {},
        },
        {
          provide: TaskAttachmentsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
