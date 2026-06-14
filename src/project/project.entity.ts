import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { Tenant } from '../tenant/tenant.entity';
import { Task } from '../tasks/task.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.projects)
  tenant!: Tenant;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Task, (task) => task.project)
  tasks!: Task[];
}