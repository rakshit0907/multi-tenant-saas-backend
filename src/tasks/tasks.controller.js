"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
exports.__esModule = true;
exports.TasksController = void 0;
var common_1 = require("@nestjs/common");
var passport_1 = require("@nestjs/passport");
var TasksController = /** @class */ (function () {
    function TasksController(tasksService) {
        this.tasksService = tasksService;
    }
    TasksController.prototype.create = function (body, req) {
        return this.tasksService.createTask(body.title, req.user.tenantId, req.user.userId);
    };
    TasksController.prototype.getTasks = function (req) {
        return this.tasksService.getTasks(req.user.tenantId, req.user.userId);
    };
    TasksController.prototype.update = function (id, body) {
        return this.tasksService.updateTask(id, body.title);
    };
    TasksController.prototype["delete"] = function (id) {
        return this.tasksService.deleteTask(id);
    };
    __decorate([
        (0, common_1.Post)(),
        __param(0, (0, common_1.Body)()),
        __param(1, (0, common_1.Req)())
    ], TasksController.prototype, "create");
    __decorate([
        (0, common_1.Get)(),
        __param(0, (0, common_1.Req)())
    ], TasksController.prototype, "getTasks");
    __decorate([
        (0, common_1.Patch)(':id'),
        __param(0, (0, common_1.Param)('id')),
        __param(1, (0, common_1.Body)())
    ], TasksController.prototype, "update");
    __decorate([
        (0, common_1.Delete)(':id'),
        __param(0, (0, common_1.Param)('id'))
    ], TasksController.prototype, "delete");
    TasksController = __decorate([
        (0, common_1.Controller)('tasks'),
        (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'))
    ], TasksController);
    return TasksController;
}());
exports.TasksController = TasksController;
