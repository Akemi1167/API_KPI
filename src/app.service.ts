import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      name: 'API KPI',
      version: '0.0.1',
    };
  }
}
