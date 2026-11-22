import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApplication } from './../src/app.setup';
import type { Environment } from './../src/config/environment';

void describe('Public demo sign-in (e2e)', () => {
  let app: INestApplication<App>;

  void beforeEach(async () => {
    process.env.DATABASE_URL ??= 'postgresql://user:password@localhost:5432/faena';
    process.env.JWT_SECRET ??= 'a-development-only-secret-over-32-characters';
    process.env.DEMO_LOGIN = 'true';

    const { AppModule } = await import('./../src/app.module.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app, app.get(ConfigService<Environment, true>));
    await app.init();
  });

  void it('POST /api/v1/auth/demo without a CSRF token is refused before any sign-in', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/demo').expect(403);
  });

  void it('POST /api/v1/auth/demo with a mismatched token is refused', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/demo')
      .set('Cookie', 'faena_csrf=cookie-token')
      .set('X-CSRF-Token', 'other-token')
      .expect(403);
  });

  void afterEach(async () => {
    delete process.env.DEMO_LOGIN;
    await app.close();
  });
});
