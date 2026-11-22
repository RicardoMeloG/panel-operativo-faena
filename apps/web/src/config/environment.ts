import { z } from 'zod';

const clientEnvironmentSchema = z.object({
  VITE_API_URL: z.url().default('http://localhost:3000/api/v1'),
  // Public demo build: the sign-in page offers the demo supervisor.
  VITE_DEMO: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export const clientEnvironment = clientEnvironmentSchema.parse(import.meta.env);
