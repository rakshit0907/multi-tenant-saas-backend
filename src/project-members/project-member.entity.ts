import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Project } from '../project/project.entity';
import { ProjectRole } from '../common/enums/project-role.enum';
@Entity()
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Project)
  project!: Project;

  @Column({
    type: 'enum',
    enum: ProjectRole,
    default: ProjectRole.MEMBER,
  })
  role!: ProjectRole;

  @CreateDateColumn()
  joinedAt!: Date;
}