import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Project } from '../project/project.entity';

@Entity()
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Project)
  project!: Project;

  @Column({
    default: 'MEMBER',
  })
  role!: string;

  @CreateDateColumn()
  joinedAt!: Date;
}