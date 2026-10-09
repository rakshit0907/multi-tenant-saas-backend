import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { WorkspaceMember } from './workspace-member.entity';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { OrganizationInvite } from './organization-invite.entity';
import { User } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      OrganizationInvite,
      User,
      WorkspaceMember,
    ]),
    NotificationsModule,
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
