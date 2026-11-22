import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import type { PrismaService } from '../../database/prisma.service';
import type { Environment } from '../../config/environment';

const supervisor = {
  id: 'u-1',
  email: 'supervisor@faena.local',
  name: 'Supervisión Turno A',
  role: 'SUPERVISOR' as const,
  active: true,
  passwordHash: 'unused',
};

function serviceWith(demo: boolean, found: typeof supervisor | null) {
  const queries: unknown[] = [];
  const prisma = {
    user: {
      findFirst: (query: unknown) => {
        queries.push(query);
        return Promise.resolve(found);
      },
    },
  } as unknown as PrismaService;
  const jwt = { signAsync: () => Promise.resolve('signed-token') } as unknown as JwtService;
  const config = {
    get: (key: string) => (key === 'DEMO_LOGIN' ? demo : 'x'.repeat(32)),
  } as unknown as ConfigService<Environment, true>;
  return { service: new AuthService(prisma, jwt, config), queries };
}

void describe('public demo sign-in', () => {
  void it('answers 404 when the demo is off, without reading any user', async () => {
    const { service, queries } = serviceWith(false, supervisor);
    await assert.rejects(() => service.demoLogin(), NotFoundException);
    assert.equal(queries.length, 0);
  });

  void it('signs in the first active supervisor, never an admin', async () => {
    const { service, queries } = serviceWith(true, supervisor);
    const result = await service.demoLogin();
    assert.equal(result.token, 'signed-token');
    assert.deepEqual(result.user, {
      id: 'u-1',
      email: 'supervisor@faena.local',
      name: 'Supervisión Turno A',
      role: 'SUPERVISOR',
    });
    assert.deepEqual(queries[0], {
      where: { role: 'SUPERVISOR', active: true },
      orderBy: { email: 'asc' },
    });
  });

  void it('answers 404 when no active supervisor exists', async () => {
    const { service } = serviceWith(true, null);
    await assert.rejects(() => service.demoLogin(), NotFoundException);
  });
});
