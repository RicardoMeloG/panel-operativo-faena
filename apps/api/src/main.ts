import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';
import type { Environment } from './config/environment';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Environment, true>);

  configureApplication(app, config);
  app.enableShutdownHooks();

  await app.listen(config.get('API_PORT', { infer: true }), '0.0.0.0');

  // Public demo: a visitor's data must not stay forever when traffic keeps
  // the service awake. Ending the process makes the host start it again,
  // and its start command reseeds (docs/deploy-render.md).
  const restartHours = config.get('DEMO_RESTART_HOURS', { infer: true });
  if (restartHours > 0) {
    setTimeout(
      () => {
        void app.close().finally(() => process.exit(0));
      },
      restartHours * 60 * 60 * 1000,
    ).unref();
  }
}

bootstrap().catch((error: unknown) => {
  console.error('The API could not start.', error);
  process.exit(1);
});
