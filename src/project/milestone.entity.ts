import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { Task } from '../tasks/task.entity';

export enum MilestoneStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  targetDate!: Date | null;

  @Column({
    type: 'enum',
    enum: MilestoneStatus,
    default: MilestoneStatus.ACTIVE,
  })
  status!: MilestoneStatus;

  @ManyToOne(() => Project, (project) => project.milestones, {
    onDelete: 'CASCADE',
  })
  project!: Project;

  @OneToMany(() => Task, (task) => task.milestone)
  tasks!: Task[];

  @CreateDateColumn()
  createdAt!: Date;
}
