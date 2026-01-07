import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { Logger, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import * as process from 'process';
import { AccessTokenUserGuard } from './modules/auth/passport-stratagies/access-token-user/access-token-user.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { ErrorFilter } from './infra/validators';
import { join } from 'path';

const logging = new Logger('Request Middleware', { timestamp: true });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error'],
    rawBody: true,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useStaticAssets(join(__dirname, 'uploads'));

  app.use(bodyParser.text({ type: 'application/xml' }));

  app.use(cookieParser());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
      logging.warn(
        `Response for ${req.method} ${req.url} - ${res?.statusCode}`,
      );
      return originalSend.call(this, data);
    };
    next();
  });

  app.useGlobalFilters(new ErrorFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new AccessTokenUserGuard(reflector),
    new RolesGuard(reflector),
  );

  const config = new DocumentBuilder()
    .setTitle('Streak.uz')
    .setDescription('Streak API description')
    .setVersion('0.2')
    .addBearerAuth()
    .addCookieAuth('access_token_user')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logging.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  logging.log(`📚 Swagger docs available at: http://0.0.0.0:${port}/docs`);
}

bootstrap();
