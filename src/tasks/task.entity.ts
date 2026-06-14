import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import { Project } from '../project/project.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ default: false })
  completed!: boolean;

  @ManyToOne(() => Project, (project) => project.tasks)
  project!: Project;
}