# Demo pública en Render

La demo vive en `https://panel.ricardomelog.com`. Son tres piezas gratuitas:

| Pieza         | Servicio                                                | Por qué                                                                  |
| ------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Panel web     | Render, sitio estático                                  | No se duerme: muestra «La demo está despertando» mientras la API arranca |
| API           | Render, servicio web con Docker (`apps/api/Dockerfile`) | Se duerme tras 15 minutos sin uso y tarda unos 30 segundos en despertar  |
| Base de datos | Prisma Postgres, plan Free, US East (N. Virginia)       | La misma región que la API                                               |

El sitio estático reenvía `/api/*` a la API. Para el navegador todo es un solo sitio, así que las cookies `SameSite=Strict` de la sesión y del CSRF funcionan sin cambios.

## Modo demo

- `DEMO_LOGIN=true` en la API habilita `POST /api/v1/auth/demo`. Esa ruta entra como el primer supervisor activo, nunca como administrador, y exige el token CSRF como `/auth/login`. Sin la variable responde 404.
- `DEMO_RESET=true` hace que el seed borre órdenes, incidentes y lecturas antes de sembrar. Como el seed corre en cada arranque, los datos vuelven al estado inicial cada vez que la demo despierta.
- `VITE_DEMO=true` al construir el panel muestra el botón «Entrar como supervisor de demostración».
- Las contraseñas de los usuarios sembrados las genera Render y nadie las conoce: la demo no las necesita.

Nunca se activan en una instalación real.

## API (servicio web)

- Runtime: Docker. Dockerfile `apps/api/Dockerfile`, contexto la raíz del repositorio.
- Región: Virginia (US East). Plan: Free.
- Docker command:

  ```sh
  sh -c "./node_modules/.bin/prisma migrate deploy --config prisma.config.ts && ./node_modules/.bin/tsx prisma/seed.ts && node dist/main.js"
  ```

- Health check: `/api/v1/health`.
- Variables:

| Variable                                           | Valor                                                                                                    |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                         | `production`                                                                                             |
| `API_PORT`                                         | `10000`                                                                                                  |
| `DATABASE_URL`                                     | La conexión directa de Prisma Postgres (sin pooling); la pega el dueño                                   |
| `JWT_SECRET`                                       | Generada por Render                                                                                      |
| `SEED_ADMIN_PASSWORD` · `SEED_SUPERVISOR_PASSWORD` | Generadas por Render                                                                                     |
| `AUTH_COOKIE_SECURE`                               | `true`                                                                                                   |
| `CORS_ORIGIN`                                      | `https://panel.ricardomelog.com` (y la dirección `*.onrender.com` del sitio estático mientras se prueba) |
| `SWAGGER_ENABLED`                                  | `false`                                                                                                  |
| `LOG_LEVEL`                                        | `info`                                                                                                   |
| `DEMO_LOGIN` · `DEMO_RESET`                        | `true`                                                                                                   |

## Panel web (sitio estático)

- Build command:

  ```sh
  corepack enable && pnpm install --frozen-lockfile && pnpm --filter @faena/contracts build && pnpm --filter @faena/web build
  ```

- Publish directory: `apps/web/dist`.
- Variables de build: `NODE_VERSION=24`, `VITE_API_URL=https://panel.ricardomelog.com/api/v1`, `VITE_DEMO=true`.
- Reglas, en este orden:
  1. Rewrite `/api/*` → `https://<servicio-api>.onrender.com/api/*`.
  2. Rewrite `/*` → `/index.html`, para las rutas del panel.
- Dominio: `panel.ricardomelog.com`, con un CNAME en Cloudflare hacia el sitio estático, en nube gris (solo DNS). Render emite el certificado.
