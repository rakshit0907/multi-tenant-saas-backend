import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, } from "typeorm";
import { Tenant } from "../tenant/tenant.entity";

@Entity()
export class OrganizationInvite {
    @PrimaryGeneratedColumn("uuid")
    id!: string; 
    
    @Column()
    email!: string;

    @Column({ unique: true })
    token!: string;

    @ManyToOne(() => Tenant, {
        onDelete: "CASCADE",
    })
    tenant!: Tenant;

    @Column({
        default: false,
    })
    accepted!: boolean;

    @Column()
    expiresAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;
    
}