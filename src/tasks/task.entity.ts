import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import { Project } from '../project/project.entity';
console.log("✅ TASK ENTITY LOADED");
@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ default: false })
  completed!: boolean;
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

  @ManyToOne(() => Project, (project) => project.tasks)
  project!: Project;
}