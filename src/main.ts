import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

let cachedApp: NestExpressApplication | undefined;

export async function createApp(): Promise<NestExpressApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  );
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

  // Serve OpenAPI JSON and a CDN-backed Swagger UI to avoid serving static assets
  const instance = app.getHttpAdapter().getInstance();
  instance.get('/api/v1/openapi.json', (_req, res) => res.json(document));

  const swaggerHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: '/api/v1/openapi.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout'
        });
      };
    </script>
  </body>
</html>`;

  instance.get('/api/v1/docs', (_req, res) => res.type('text/html').send(swaggerHtml));

  await app.init();
  cachedApp = app;
  return app;
}

export async function bootstrap() {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);

  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/v1/docs`);
}

export async function handler(req: Request, res: Response, next?: NextFunction) {
  const app = await createApp();
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();

  if (typeof next === 'function') {
    return instance(req, res, next);
  }

  return new Promise<void>((resolve, reject) => {
    const callback = (error?: unknown) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
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
