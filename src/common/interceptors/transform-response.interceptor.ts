import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) {
          return data;
        }

        if (this.isPaginatedResult(data)) {
          return data;
        }

        return { data };
      }),
    );
  }

  private isPaginatedResult(data: unknown): data is PaginatedResult<unknown> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'data' in data &&
      'meta' in data &&
      Array.isArray((data as PaginatedResult<unknown>).data)
    );
  }
}
