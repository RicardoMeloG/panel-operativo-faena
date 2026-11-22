import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DEMO_MAX_WORK_ORDERS, WorkOrdersService } from './work-orders.service';
import type { PrismaService } from '../../database/prisma.service';
import type { Environment } from '../../config/environment';

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'supervisor@faena.local',
  name: 'Supervisión',
  role: 'SUPERVISOR' as const,
};

function serviceWith(demo: boolean, count: number) {
  const created: unknown[] = [];
  const prisma = {
    workOrder: {
      count: () => Promise.resolve(count),
      create: ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return Promise.resolve({
          id: 'order-1',
          status: 'OPEN',
          priority: 'HIGH',
          title: data.title,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user,
          team: null,
          incident: null,
        });
      },
    },
  } as unknown as PrismaService;
  const config = { get: () => demo } as unknown as ConfigService<Environment, true>;
  return { service: new WorkOrdersService(prisma, config), created };
}

void describe('work orders in the public demo', () => {
  void it('refuses a new order once the demo holds the maximum', async () => {
    const { service, created } = serviceWith(true, DEMO_MAX_WORK_ORDERS);
    await assert.rejects(
      () => service.create({ title: 'Otra', priority: 'HIGH' }, user),
      ConflictException,
    );
    assert.equal(created.length, 0);
  });

  void it('creates below the maximum, and without limit outside the demo', async () => {
    const below = serviceWith(true, DEMO_MAX_WORK_ORDERS - 1);
    await below.service.create({ title: 'Una', priority: 'HIGH' }, user);
    assert.equal(below.created.length, 1);
    const real = serviceWith(false, DEMO_MAX_WORK_ORDERS * 10);
    await real.service.create({ title: 'Real', priority: 'HIGH' }, user);
    assert.equal(real.created.length, 1);
  });
});
