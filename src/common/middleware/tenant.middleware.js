"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.TenantMiddleware = void 0;
var common_1 = require("@nestjs/common");
var jwt = require("jsonwebtoken");
console.log("🔥 MIDDLEWARE RUNNING");
var TenantMiddleware = /** @class */ (function () {
    function TenantMiddleware() {
    }
    TenantMiddleware.prototype.use = function (req, res, next) {
        var authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            var token = authHeader.split(' ')[1];
            try {
                var authHeader_1 = req.headers['authorization'];
                console.log("AUTH HEADER:", authHeader_1);
                var decoded = jwt.verify(token, 'secretKey'); // ⚠️ same secret as login
                req['tenantId'] = decoded.tenantId;
                console.log("✅ TENANT FROM TOKEN:", decoded.tenantId);
            }
            catch (error) {
                console.log("❌ TOKEN ERROR:", error instanceof Error ? error.message : String(error));
            }
        }
        else {
            console.log("❌ NO AUTH HEADER");
        }
        next();
    };
    TenantMiddleware = __decorate([
        (0, common_1.Injectable)()
    ], TenantMiddleware);
    return TenantMiddleware;
}());
exports.TenantMiddleware = TenantMiddleware;
