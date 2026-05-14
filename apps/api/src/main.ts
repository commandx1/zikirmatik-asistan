import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
