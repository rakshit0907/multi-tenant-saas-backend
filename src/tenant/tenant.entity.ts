import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../users/user.entity';

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @CreateDateColumn()
  created_at!: Date;

  // ✅ FIX 1: Project relation
  @OneToMany(() => Project, (project) => project.tenant)
  projects!: Project[];

  // ✅ FIX 2: User relation (this was causing your last error)
  @OneToMany(() => User, (user) => user.tenant)
  users!: User[];
}