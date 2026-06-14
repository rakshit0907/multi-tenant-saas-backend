import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { ProjectModule } from './project/project.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantModule } from './tenant/tenant.module';

import { ProtectedController } from './protected/protected.controller';
import { TasksModule } from './tasks/tasks.module';

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