import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
<<<<<<< HEAD
import { ExpressAdapter } from '@nestjs/platform-express';

import type { INestApplication } from '@nestjs/common';

let cachedApp: INestApplication | null = null;

async function createApp() {
=======
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

let cachedApp: NestExpressApplication | undefined;

async function createApp(): Promise<NestExpressApplication> {
>>>>>>> c481888b78042bda0a9498cbfbcc0f5430467d55
  if (cachedApp) {
    return cachedApp;
  }

<<<<<<< HEAD
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
=======
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  );
>>>>>>> c481888b78042bda0a9498cbfbcc0f5430467d55

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EDU3 LMS API')
    .setDescription('Learning Management System API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  cachedApp = app;
<<<<<<< HEAD

=======
>>>>>>> c481888b78042bda0a9498cbfbcc0f5430467d55
  return app;
}

export async function bootstrap() {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
<<<<<<< HEAD
=======

>>>>>>> c481888b78042bda0a9498cbfbcc0f5430467d55
  await app.listen(port);

  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

<<<<<<< HEAD
export async function handler(req: any, res: any, next?: any) {
=======
export async function handler(req: Request, res: Response, next?: NextFunction) {
>>>>>>> c481888b78042bda0a9498cbfbcc0f5430467d55
  const app = await createApp();
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();

  if (typeof next === 'function') {
    return instance(req, res, next);
  }

<<<<<<< HEAD
  return new Promise((resolve, reject) => {
    const callback = (error: any) => {
=======
  return new Promise<void>((resolve, reject) => {
    const callback = (error?: unknown) => {
>>>>>>> c481888b78042bda0a9498cbfbcc0f5430467d55
      if (error) {
        reject(error);
        return;
      }
<<<<<<< HEAD
      resolve(undefined);
=======
      resolve();
>>>>>>> c481888b78042bda0a9498cbfbcc0f5430467d55
    };

    instance(req, res, callback);
  });
}

export default handler;

if (require.main === module) {
  bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
