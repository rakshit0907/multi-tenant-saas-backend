import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';

export enum ActivityAction {
  PROJECT_CREATED = 'PROJECT_CREATED',

  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',

  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_PRIORITY_CHANGED = 'TASK_PRIORITY_CHANGED',
}

@Entity()
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ActivityAction,
  })
  action!: ActivityAction;

  @ManyToOne(
    () => Project,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  project!: Project;

  @ManyToOne(
    () => User,
    {
      nullable: false,
    },
  )
  user!: User;

  @ManyToOne(
    () => Task,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  task!: Task | null;

  @Column({
    type: 'json',
    nullable: true,
  })
  metadata!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;
}