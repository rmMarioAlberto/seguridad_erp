import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((payload) => {
        const request = context.switchToHttp().getRequest();
        const url = request.url;
        let prefix = 'SxUS';
        if (url.includes('/groups')) {
            prefix = 'SxGR';
        }

        return {
          statusCode: response.statusCode,
          intOpCode: payload?.intOpCode ?? `${prefix}${response.statusCode}`,
          data: payload?.data !== undefined ? payload.data : payload,
        };
      }),
    );
  }
}
