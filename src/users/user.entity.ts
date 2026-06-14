import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { Role } from '../common/enums/role.enum';


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
}