import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { KpiEventTypesService } from '../kpi/services/kpi-event-types.service';
import { UsersService } from '../users/users.service';
import { ADMIN_USER_SEED } from './seed-data/admin-user.data';
import { KPI_EVENT_TYPES_SEED } from './seed-data/kpi-event-types.data';
import { printSeedAllResult } from './seed-log.util';

async function seedAll() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const usersService = app.get(UsersService);
  const kpiEventTypesService = app.get(KpiEventTypesService);

  let adminCreated = false;
  let eventTypesCreated = 0;

  try {
    const adminResult = await usersService.upsertSeedAdmin({
      ...ADMIN_USER_SEED,
    });
    adminCreated = adminResult.created;

    for (const item of KPI_EVENT_TYPES_SEED) {
      try {
        await kpiEventTypesService.create({
          code: item.code,
          name: item.name,
          eventKind: item.eventKind,
          defaultPoints: item.defaultPoints,
        });
        eventTypesCreated++;
      } catch {
        // skip duplicate
      }
    }
  } catch (error) {
    console.error(
      'Seed failed:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  } finally {
    await app.close();
    printSeedAllResult(adminCreated, eventTypesCreated);
  }
}

void seedAll();
