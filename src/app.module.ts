import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
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
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'saas_db',
      autoLoadEntities: true,
      synchronize: true,
      
      
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
  ],

  // ✅ CORRECT PLACE
  controllers: [ProtectedController],

  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}