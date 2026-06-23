import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const SWAGGER_JWT_NAME = 'JWT-auth';

export function ApiAdminAuth() {
  return applyDecorators(
    ApiBearerAuth(SWAGGER_JWT_NAME),
    ApiUnauthorizedResponse({
      description: 'Chưa đăng nhập hoặc token không hợp lệ',
    }),
    ApiForbiddenResponse({ description: 'Không đủ quyền ADMIN' }),
  );
}
