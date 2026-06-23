import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { KpiEventTypesService } from '../kpi/services/kpi-event-types.service';
import { KPI_EVENT_TYPES_SEED } from './seed-data/kpi-event-types.data';
import { printSeedEventTypesResult } from './seed-log.util';

async function seedEventTypes() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const kpiEventTypesService = app.get(KpiEventTypesService);

  let created = 0;
  let skipped = 0;

  try {
    for (const item of KPI_EVENT_TYPES_SEED) {
      try {
        await kpiEventTypesService.create({
          code: item.code,
          name: item.name,
          eventKind: item.eventKind,
          defaultPoints: item.defaultPoints,
        });
        created++;
      } catch {
        skipped++;
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
    printSeedEventTypesResult(created, skipped);
  }
}

void seedEventTypes();
