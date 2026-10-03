import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { WorkspaceMember } from '../tenant/workspace-member.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepo: Repository<WorkspaceMember>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secretKey',
    });
  }

  async validate(payload: any) {
    const userId = payload.userId;
    const tenantId = payload.tenantId;

    if (!userId || !tenantId) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    const membership = await this.workspaceMemberRepo.findOne({
      where: {
        user: {
          id: userId,
        },
        tenant: {
          id: tenantId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException(
        'You are no longer a member of this workspace',
      );
    }

    return {
      userId,
      tenantId,
      role: payload.role,

      // Important: use the current DB role,
      // not the potentially stale JWT role.
      workspaceRole: membership.role,
    };
  }
}
