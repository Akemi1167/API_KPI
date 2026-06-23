import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_JWT_NAME } from '../decorators/api-admin-auth.decorator';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('API KPI Management')
    .setDescription(
      'API quản lý KPI — xác thực JWT, quản lý user, kỳ KPI, cộng/trừ điểm và tính kết quả.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập JWT token từ POST /api/auth/login',
      },
      SWAGGER_JWT_NAME,
    )
    .addTag('Health', 'Kiểm tra trạng thái API')
    .addTag('Auth', 'Đăng nhập và thông tin tài khoản')
    .addTag('Users', 'Quản lý người dùng (ADMIN)')
    .addTag('KPI Periods', 'Quản lý kỳ KPI (ADMIN)')
    .addTag('KPI Event Types', 'Danh mục loại cộng/trừ điểm (ADMIN)')
    .addTag('KPI Events', 'Nhập sự kiện cộng/trừ điểm (ADMIN)')
    .addTag('KPI Results', 'Tính và duyệt kết quả KPI (ADMIN)')
    .addTag('Public KPI Catalog', 'Danh mục cộng/trừ điểm công khai cho nhân viên')
    .addTag('My KPI', 'Nhân viên xem kết quả KPI của mình')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
