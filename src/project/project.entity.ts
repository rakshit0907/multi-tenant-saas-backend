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
  @OneToMany(
    () => ProjectMember,
    (member) => member.project,
  )
  members!: ProjectMember[];

  @OneToMany(
  () => Label,
  (label) => label.project,
)
labels!: Label[];
}