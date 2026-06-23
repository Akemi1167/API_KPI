import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { KpiEventTypesController } from './controllers/kpi-event-types.controller';
import { KpiEventsController } from './controllers/kpi-events.controller';
import { KpiPeriodsController } from './controllers/kpi-periods.controller';
import { KpiResultsController } from './controllers/kpi-results.controller';
import { MeKpiResultsController } from './controllers/me-kpi-results.controller';
import { PublicKpiEventTypesController } from './controllers/public-kpi-event-types.controller';
import { KpiEvent, KpiEventSchema } from './schemas/kpi-event.schema';
import {
  KpiEventType,
  KpiEventTypeSchema,
} from './schemas/kpi-event-type.schema';
import { KpiPeriod, KpiPeriodSchema } from './schemas/kpi-period.schema';
import { KpiResult, KpiResultSchema } from './schemas/kpi-result.schema';
import { KpiEventTypesService } from './services/kpi-event-types.service';
import { KpiEventsService } from './services/kpi-events.service';
import { KpiPeriodsService } from './services/kpi-periods.service';
import { KpiResultsService } from './services/kpi-results.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: KpiPeriod.name, schema: KpiPeriodSchema },
      { name: KpiEventType.name, schema: KpiEventTypeSchema },
      { name: KpiEvent.name, schema: KpiEventSchema },
      { name: KpiResult.name, schema: KpiResultSchema },
    ]),
  ],
  controllers: [
    KpiPeriodsController,
    KpiEventTypesController,
    PublicKpiEventTypesController,
    KpiEventsController,
    KpiResultsController,
    MeKpiResultsController,
  ],
  providers: [
    KpiPeriodsService,
    KpiEventTypesService,
    KpiEventsService,
    KpiResultsService,
  ],
})
export class KpiModule {}
