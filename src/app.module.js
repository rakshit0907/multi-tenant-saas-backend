"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var nestjs_cls_1 = require("nestjs-cls");
var tenant_middleware_1 = require("./common/middleware/tenant.middleware");
var auth_module_1 = require("./auth/auth.module");
var users_module_1 = require("./users/users.module");
var tenant_module_1 = require("./tenant/tenant.module");
var protected_controller_1 = require("./protected/protected.controller");
var tasks_module_1 = require("./tasks/tasks.module");
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule.prototype.configure = function (consumer) {
        consumer.apply(tenant_middleware_1.TenantMiddleware).forRoutes('*');
    };
    AppModule = __decorate([
        (0, common_1.Module)({
            imports: [
                typeorm_1.TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: 'localhost',
                    port: 5432,
                    username: 'postgres',
                    password: 'postgres',
                    database: 'saas_db',
                    autoLoadEntities: true,
                    synchronize: true
                }),
                nestjs_cls_1.ClsModule.forRoot({
                    global: true,
                    middleware: {
                        mount: true
                    }
                }),
                auth_module_1.AuthModule,
                users_module_1.UsersModule,
                tenant_module_1.TenantModule,
                tasks_module_1.TasksModule,
            ],
            // ✅ CORRECT PLACE
            controllers: [protected_controller_1.ProtectedController],
            providers: []
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
