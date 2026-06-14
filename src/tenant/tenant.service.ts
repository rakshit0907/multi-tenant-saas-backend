import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>, // ✅ THIS WAS MISSING
  ) {}

  async create(data: { name: string }) {
    if (!data.name) {
      throw new Error('Tenant name is required');
    }

    const tenant = this.repo.create({
      name: data.name,
    });

    return await this.repo.save(tenant);
  }
}