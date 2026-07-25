import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { Role } from '../common/enums/role.enum';
import { OneToMany } from 'typeorm';
import { ProjectMember } from '../project-members/project-member.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: 'admin' })

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  tenant!: Tenant;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role!: Role;

  @OneToMany(
    () => ProjectMember,
    (member) => member.user,
  )
  projects!: ProjectMember[];
}