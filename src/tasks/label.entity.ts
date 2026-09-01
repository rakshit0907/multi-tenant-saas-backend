import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, } from 'typeorm';
import { Project } from '../project/project.entity';
import { Task } from './task.entity';

@Entity('labels')
export class Label {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

     @Column()
     name!: string;

    @Column({
      default: '#6B7280',
    })
    color!: string;

    @ManyToOne(
      () => Project,
      (project) => project.labels,
      {
        onDelete: 'CASCADE',
      },
    )
    project!: Project;

    @ManyToMany(
      () => Task,
      (task) => task.labels,
    )
    tasks!: Task[];
 }