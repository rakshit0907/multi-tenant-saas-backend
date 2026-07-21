import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import { Project } from '../project/project.entity';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}


@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({
    default: false,
  })
  completed!: boolean;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({
  type: 'enum',
  enum: TaskStatus,
  default: TaskStatus.PENDING,
})
status!: TaskStatus;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  dueDate!: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string;

  @ManyToOne(
    () => Project,
    (project) => project.tasks,
  )
  project!: Project;
}