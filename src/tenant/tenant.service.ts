import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from './tenant.entity';
import { OrganizationInvite } from './organization-invite.entity';
import { User } from '../users/user.entity';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,

    @InjectRepository(OrganizationInvite)
    private inviteRepo: Repository<OrganizationInvite>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
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

  async create(data: { name: string }) {
    if (!data.name) {
      throw new Error('Tenant name is required');
    }

    const tenant = this.tenantRepo.create({
      name: data.name,
    });

    return await this.tenantRepo.save(tenant);

  }
}