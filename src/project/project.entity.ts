import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { ProjectMember } from '../project-members/project-member.entity';
import { Tenant } from '../tenant/tenant.entity';
import { Task } from '../tasks/task.entity';
import { Label } from '../tasks/label.entity';
import { Milestone } from './milestone.entity';

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status!: ProjectStatus;

  @Column({ type: 'timestamp', nullable: true })
  startDate!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dueDate!: Date | null;

  @ManyToOne(() => Tenant, (tenant) => tenant.projects)
  tenant!: Tenant;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Task, (task) => task.project)
  tasks!: Task[];

  @OneToMany(() => ProjectMember, (member) => member.project)
  members!: ProjectMember[];

  @OneToMany(() => Label, (label) => label.project)
  labels!: Label[];

  @OneToMany(() => Milestone, (milestone) => milestone.project)
  milestones!: Milestone[];
}
