import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getDataSourceToken } from '@nestjs/typeorm';
import { seedRoles } from './core/database/seeds/roles.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // ── Auto-seed: ensure default roles exist ──────────────────────────────────
  try {
    const dataSource = app.get(getDataSourceToken());
    await seedRoles(dataSource);
    console.log('🌱 Seed de roles completado.');
  } catch (err) {
    console.error('⚠️  Error ejecutando seed de roles:', err);
  }
  // ───────────────────────────────────────────────────────────────────────────

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('The haptica API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.enableCors();

  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
