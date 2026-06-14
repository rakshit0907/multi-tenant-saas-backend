"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.User = void 0;
var typeorm_1 = require("typeorm");
var tenant_entity_1 = require("../tenant/tenant.entity");
var role_enum_1 = require("../common/enums/role.enum");
var User = /** @class */ (function () {
    function User() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
    ], User.prototype, "id");
    __decorate([
        (0, typeorm_1.Column)()
    ], User.prototype, "name");
    __decorate([
        (0, typeorm_1.Column)({ unique: true })
    ], User.prototype, "email");
    __decorate([
        (0, typeorm_1.Column)()
    ], User.prototype, "password");
    __decorate([
        (0, typeorm_1.Column)({ "default": 'admin' }),
        (0, typeorm_1.CreateDateColumn)()
    ], User.prototype, "created_at");
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return tenant_entity_1.Tenant; }, function (tenant) { return tenant.users; })
    ], User.prototype, "tenant");
    __decorate([
        (0, typeorm_1.Column)({
            type: 'enum',
            "enum": role_enum_1.Role,
            "default": role_enum_1.Role.USER
        })
    ], User.prototype, "role");
    User = __decorate([
        (0, typeorm_1.Entity)()
    ], User);
    return User;
}());
exports.User = User;
