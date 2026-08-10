import { Controller, Get, Param, Req, UseGuards, } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActivityService } from './activity.service';

@Controller('activity')
@UseGuards(AuthGuard('jwt'))
export class ActivityController {
    constructor(
        private readonly activityService: ActivityService,
    ) {}

    @Get('project/:projectId')
    getProjectActivity(
        @Param('projectId') projectId: string,
        @Req() req: any,
    ) {
        return this.activityService.getProjectActivity(
            projectId,
            req.user.tenantId,
        );
    }
}