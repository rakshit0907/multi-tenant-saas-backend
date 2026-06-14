import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
console.log("🔥 MIDDLEWARE RUNNING");
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const authHeader = req.headers['authorization'];
console.log("AUTH HEADER:", authHeader);
        const decoded: any = jwt.verify(token, 'secretKey'); // ⚠️ same secret as login

        req['tenantId'] = decoded.tenantId;

        console.log("✅ TENANT FROM TOKEN:", decoded.tenantId);
      } catch (error) {
        console.log("❌ TOKEN ERROR:", error instanceof Error ? error.message : String(error));
      }
    } else {
      console.log("❌ NO AUTH HEADER");
    }

    next();
  }
}