import type { ThrottlerModuleOptions } from '@nestjs/throttler';

export const authThrottlerOptions: ThrottlerModuleOptions = {
    throttlers: [{ ttl: 60000, limit: 10 }],
    errorMessage: 'Too many attempts. Please wait a few minutes and try again.',
};