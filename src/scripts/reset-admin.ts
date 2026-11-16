import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { getAdminUserSeed } from './seed-data/admin-user.data';
import { printResetAdminResult } from './seed-log.util';

/**
 * Reset khẩn cấp tài khoản admin:
 * - Đồng bộ/tạo lại admin từ env
 * - Đặt mật khẩu mới (ADMIN_PASSWORD hoặc sinh mật khẩu mạnh)
 * - Mở khóa đăng nhập (xóa failedLoginAttempts / lockUntil)
 * - Kích hoạt lại isActive
 *
 * Chạy: npm run reset:admin
 * Tuỳ chọn: ADMIN_PASSWORD='YourStrong!Pass1' npm run reset:admin
 */
async function resetAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const usersService = app.get(UsersService);
  const seed = getAdminUserSeed({ forceGeneratePassword: true });

  let created = false;

  try {
    const result = await usersService.upsertSeedAdmin({
      employeeCode: seed.employeeCode,
      fullName: seed.fullName,
      email: seed.email,
      password: seed.password,
      role: seed.role,
      positionName: seed.positionName,
      departmentName: seed.departmentName,
    });
    created = result.created;
  } catch (error) {
    console.error(
      'Reset admin failed:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  } finally {
    await app.close();
    if (process.exitCode !== 1) {
      printResetAdminResult({
        created,
        email: seed.email,
        password: seed.password,
        passwordGenerated: seed.passwordGenerated,
      });
    }
  }
}

void resetAdmin();
