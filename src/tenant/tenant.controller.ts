import { Controller, Post, Body, Req, UseGuards,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantService } from './tenant.service';

@Controller('tenant')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('invite')
  createInvite(
    @Body('email') email: string,
    @Req() req,
  ) {
    return this.tenantService.createInvite(
      req.user.tenantId,
      email,
    );
  }
}