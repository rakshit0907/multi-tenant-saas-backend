"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop();continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.AuthService = void 0;
var common_1 = require("@nestjs/common");
var bcrypt = require("bcrypt");
var AuthService = /** @class */ (function () {
    function AuthService(usersService, tenantService, jwtService) {
        this.usersService = usersService;
        this.tenantService = tenantService;
        this.jwtService = jwtService;
    }
    AuthService.prototype.signup = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var name, email, password, tenantName, existingUser, tenant, hashedPassword, user, payload, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        name = data.name, email = data.email, password = data.password, tenantName = data.tenantName;
                        return [4 /*yield*/, this.usersService.findByEmail(email)];
                    case 1:
                        existingUser = _a.sent();
                        if (existingUser) {
                            throw new common_1.BadRequestException('User already exists');
                        }
                        return [4 /*yield*/, this.tenantService.create(tenantName)];
                    case 2:
                        tenant = _a.sent();
                        return [4 /*yield*/, bcrypt.hash(password, 10)];
                    case 3:
                        hashedPassword = _a.sent();
                        return [4 /*yield*/, this.usersService.create({
                                name: name,
                                email: email,
                                password: hashedPassword,
                                tenant: tenant
                            })];
                    case 4:
                        user = _a.sent();
                        payload = {
                            userId: user.id,
                            tenantId: tenant.id
                        };
                        token = this.jwtService.sign(payload);
                        return [2 /*return*/, {
                                message: 'User created successfully',
                                token: token,
                                user: {
                                    id: user.id,
                                    name: user.name,
                                    email: user.email
                                }
                            }];
                }
            });
        });
    };
    // 👇 ADD THIS LOGIN METHOD
    AuthService.prototype.login = function (data) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var email, password, user, isMatch, payload, token;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        email = data.email, password = data.password;
                        console.log("STEP 1: Email:", email);
                        return [4 /*yield*/, this.usersService.findByEmail(email)];
                    case 1:
                        user = _b.sent();
                        console.log("STEP 2: User:", user);
                        if (!user) {
                            console.log("❌ USER NOT FOUND");
                            throw new common_1.BadRequestException('Invalid credentials');
                        }
                        return [4 /*yield*/, bcrypt.compare(password, user.password)];
                    case 2:
                        isMatch = _b.sent();
                        console.log("STEP 3: Password match:", isMatch);
                        if (!isMatch) {
                            console.log("❌ PASSWORD WRONG");
                            throw new common_1.BadRequestException('Invalid credentials');
                        }
                        payload = {
                            userId: user.id,
                            tenantId: (_a = user.tenant) === null || _a === void 0 ? void 0 : _a.id,
                            role: user.role
                        };
                        token = this.jwtService.sign(payload);
                        console.log("✅ LOGIN SUCCESS");
                        return [2 /*return*/, {
                                message: 'Login successful',
                                token: token
                            }];
                }
            });
        });
    };
    AuthService = __decorate([
        (0, common_1.Injectable)()
    ], AuthService);
    return AuthService;
}());
exports.AuthService = AuthService;
