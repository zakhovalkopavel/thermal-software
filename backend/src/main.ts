import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'ssr', method: RequestMethod.GET },
      { path: 'ssr/(.*)', method: RequestMethod.GET },
    ],
  });

  const config = new DocumentBuilder()
    .setTitle('Thermal Software API')
    .setDescription('NestJS API for thermal engineering calculations')
    .setVersion('2.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT;
  const HTTP_PORT = process.env.HTTP_PORT;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${HTTP_PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${HTTP_PORT}/api/docs`);
}
bootstrap();
