import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { Task } from './task.entity';
import { User } from '../users/user.entity';

@Entity()
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'text',
  })
  content!: string;

  @ManyToOne(() => Task, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  task!: Task;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  author!: User;

  @CreateDateColumn()
  createdAt!: Date;
}