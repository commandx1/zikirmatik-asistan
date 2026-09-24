import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { AllExceptionsFilter } from './common/logging/all-exceptions.filter';
import { requestContext } from './common/logging/request-context';

// main.ts ve e2e harness'ı (test/helpers/create-test-app.ts) aynı zinciri kullanır.
export function configureApp(app: INestApplication) {
  app.use(requestContext);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
}
