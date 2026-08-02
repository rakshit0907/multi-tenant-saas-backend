import { Controller, Post, Body, Req, UseGuards,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantService } from './tenant.service';
import { AcceptInviteDto } from "./dto/accept-invite.dto";
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

  @Post('accept-invite')
  acceptInvite(
    @Body() body: AcceptInviteDto,
  ) {
    return this.tenantService.acceptInvite(
        body.token,
        body.name,
        body.password,
    );
  }
}