"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.TenantModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var tenant_entity_1 = require("./tenant.entity");
var tenant_service_1 = require("./tenant.service");
var tenant_controller_1 = require("./tenant.controller");
var TenantModule = /** @class */ (function () {
    function TenantModule() {
    }
    TenantModule = __decorate([
        (0, common_1.Module)({
            imports: [typeorm_1.TypeOrmModule.forFeature([tenant_entity_1.Tenant])],
            providers: [tenant_service_1.TenantService],
            controllers: [tenant_controller_1.TenantController],
            exports: [tenant_service_1.TenantService]
        })
    ], TenantModule);
    return TenantModule;
}());
exports.TenantModule = TenantModule;
