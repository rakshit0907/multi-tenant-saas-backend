import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { OrganizationInvite } from './organization-invite.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      OrganizationInvite,
      User,
    ]),
    JwtModule.register({
      secret: 'secretKey',
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}