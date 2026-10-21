import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { ProjectModule } from './project/project.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantModule } from './tenant/tenant.module';
import { ProjectMembersModule } from './project-members/project-members.module';
import { ProtectedController } from './protected/protected.controller';
import { TasksModule } from './tasks/tasks.module';
import { ProjectInvitationsModule } from './project-invitations/project-invitations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
   TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'saas_db',
  autoLoadEntities: true,
  synchronize: false,
}),
    ProjectModule,
    ActivityModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),

    AuthModule,
    UsersModule,
    TenantModule,
    TasksModule,
    ProjectMembersModule,
    ProjectInvitationsModule,
    NotificationsModule,
    EmailModule,
    DashboardModule,
  ],

  // ✅ CORRECT PLACE
  controllers: [ProtectedController],

  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/signup',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/verify-email',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/resend-verification',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/verify-email-link',
          method: RequestMethod.GET,
        },
      )
      .forRoutes('*');
  }
}
