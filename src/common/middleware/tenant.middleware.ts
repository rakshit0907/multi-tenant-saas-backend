import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const authHeader = req.headers['authorization'];
        const decoded: any = jwt.verify(token, 'secretKey'); // ⚠️ same secret as login

        req['tenantId'] = decoded.tenantId;
      } catch (error) {}
    } else {
    }

    next();
  }
}
