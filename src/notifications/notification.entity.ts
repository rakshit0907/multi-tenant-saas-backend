import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Project } from '../project/project.entity';

export enum NotificationType {
  PROJECT_INVITATION = 'PROJECT_INVITATION',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user!: User;

  @ManyToOne(() => Project, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  project!: Project | null;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column({
    type: 'text',
  })
  message!: string;

  @Column({
    default: false,
  })
  isRead!: boolean;

  @Column({
    type: 'json',
    nullable: true,
  })
  metadata!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;
}