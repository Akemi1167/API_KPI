import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { getAdminUserSeed } from './seed-data/admin-user.data';
import { printSeedAdminResult } from './seed-log.util';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const usersService = app.get(UsersService);
  const seed = getAdminUserSeed();

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
      'Seed failed:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  } finally {
    await app.close();
    if (process.exitCode !== 1) {
      printSeedAdminResult({
        created,
        email: seed.email,
        password: seed.password,
        passwordGenerated: seed.passwordGenerated,
      });
    }
  }
}

void seedAdmin();
