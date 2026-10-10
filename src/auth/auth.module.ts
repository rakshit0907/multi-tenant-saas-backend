import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TenantModule } from '../tenant/tenant.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMember } from '../tenant/workspace-member.entity';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule, // ✅ REQUIRED
    TenantModule,
    TypeOrmModule.forFeature([WorkspaceMember]),
   JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.getOrThrow<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: '1d',
    },
  }),
}),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
