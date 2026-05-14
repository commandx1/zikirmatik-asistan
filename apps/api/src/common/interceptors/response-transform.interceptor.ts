import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
};

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessEnvelope<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessEnvelope<T>> {
    return next.handle().pipe(
      map((data: T) => {
        const maybeEnvelope = data as { success?: boolean; data?: unknown };

        if (maybeEnvelope?.success === true && 'data' in maybeEnvelope) {
          return data as ApiSuccessEnvelope<T>;
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
