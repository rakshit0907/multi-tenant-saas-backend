import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany, 
  JoinTable,
} from 'typeorm';
import { Label } from './label.entity';
import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';
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

  @ManyToOne(
    () => User,
    {
      nullable: true },
  )
  assignee?: User;

  @ManyToMany(
  () => Label,
  (label) => label.tasks,
  {
    cascade: false,
  },
)
@JoinTable({
  name: 'task_labels',
})
labels!: Label[];
}