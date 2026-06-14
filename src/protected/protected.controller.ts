import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('api/protected')
export class ProtectedController {
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('user')
  @Get()
  getProtected(@Req() req) {// debug

    return {
      message: 'Tenant check working 🚀',
      user: req.user,
    };
  }
}