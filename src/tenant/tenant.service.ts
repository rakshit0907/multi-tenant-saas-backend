import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Tenant } from './tenant.entity';
import { OrganizationInvite } from './organization-invite.entity';
import { User } from '../users/user.entity';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '../common/enums/role.enum';
@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,

    @InjectRepository(OrganizationInvite)
    private inviteRepo: Repository<OrganizationInvite>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private jwtService: JwtService,
  ) {}

 
  async createInvite(
    tenantId: string,
    email: string,
   ) {
     const tenant = await this.tenantRepo.findOne({
       where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const existingUser = await this.userRepo.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const token = randomUUID();

    const invite = this.inviteRepo.create({
      email,
      token,
      tenant,
      expiresAt: new Date(
        Date.now() + 1000 * 60 * 60 * 24,
     ),
   });

    await this.inviteRepo.save(invite);

    return {
      message: "Invite created",
      token,
   };
 }

  async acceptInvite(
    token: string,
    name: string,
    password: string,
 ) {
   const invite = await this.inviteRepo.findOne({
     where: {
       token,
      },
      relations: ["tenant"],
    });
     console.log("INVITE:", invite);
    if (!invite) {
      throw new Error("Invalid invite");
   }

   if (invite.expiresAt < new Date()) {
     throw new Error("Invite expired");
   }

   const existingUser = await this.userRepo.findOne({
     where: {
       email: invite.email,
     },
   });

   if (existingUser) {
     throw new Error("User already exists");
   }

   const hashedPassword = await bcrypt.hash(password, 10);

   const user = this.userRepo.create({
     name,
     email: invite.email,
     password: hashedPassword,
     role: Role.USER,
     tenant: invite.tenant,
   });

   const savedUser = await this.userRepo.save(user);

   invite.accepted = true;
   await this.inviteRepo.save(invite);

   const payload = {
     userId: savedUser.id,
     tenantId: invite.tenant.id,
     role: savedUser.role,
   };

   const access_token = this.jwtService.sign(payload);

   return {
     access_token,
     user: {
       id: savedUser.id,
       name: savedUser.name,
       email: savedUser.email,
       tenantId: invite.tenant.id,
     },
   };
 }

  async create(data: { name: string }) {
    if (!data.name) {
      throw new Error('Tenant name is required');
    }

    const tenant = this.tenantRepo.create({
      name: data.name,
    });

    return await this.tenantRepo.save(tenant);

  }

  async getOrganizationUsers(
    tenantId: string,
   ) {
    return this.userRepo.find({
      where: {
        tenant: {
        id: tenantId,
      },
    },
     select: {
       id: true,
       name: true,
       email: true,
       role: true,
     },
     order: {
       name: 'ASC',
     },
   });
  }
}