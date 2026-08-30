import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from '../users/user.entity';

@Entity('task_attachments')
export class TaskAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  originalName!: string;

  @Column()
  fileName!: string;

  @Column({ select: false })
  filePath!: string;

  @Column()
  mimeType!: string;

  @Column('bigint')
  size!: number;

  @ManyToOne(() => Task, {
    onDelete: 'CASCADE',
  })
  task!: Task;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  uploadedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;
}