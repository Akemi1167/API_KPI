import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { ADMIN_USER_SEED } from './seed-data/admin-user.data';
import { printSeedAdminResult } from './seed-log.util';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const usersService = app.get(UsersService);

  let created = false;

  try {
    const result = await usersService.upsertSeedAdmin({ ...ADMIN_USER_SEED });
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
      printSeedAdminResult(created);
    }
  }
}

void seedAdmin();
