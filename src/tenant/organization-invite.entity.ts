import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { WorkspaceRole } from './workspace-member.entity';

@Entity()
export class OrganizationInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ unique: true })
  tokenHash!: string;

  @ManyToOne(() => Tenant, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  tenant!: Tenant;

  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  role!: WorkspaceRole;

  @Column({ default: false })
  accepted!: boolean;

  @Column()
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}