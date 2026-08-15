import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity()
export class ProjectInvitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Project, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  project!: Project;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  invitedUser!: User;

  @ManyToOne(() => User, {
    nullable: false,
  })
  invitedBy!: User;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @CreateDateColumn()
  createdAt!: Date;
}