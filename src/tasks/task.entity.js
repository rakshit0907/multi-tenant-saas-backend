"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.Task = void 0;
var typeorm_1 = require("typeorm");
var Task = /** @class */ (function () {
    function Task() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
    ], Task.prototype, "id");
    __decorate([
        (0, typeorm_1.Column)()
    ], Task.prototype, "title");
    __decorate([
        (0, typeorm_1.Column)({ "default": false })
    ], Task.prototype, "completed");
    __decorate([
        (0, typeorm_1.Column)()
    ], Task.prototype, "tenantId");
    __decorate([
        (0, typeorm_1.Column)()
    ], Task.prototype, "userId");
    Task = __decorate([
        (0, typeorm_1.Entity)()
    ], Task);
    return Task;
}());
exports.Task = Task;
