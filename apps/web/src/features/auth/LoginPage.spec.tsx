import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { esCL } from '@faena/contracts';
import { AppProviders } from '../../app/providers';
import { clientEnvironment } from '../../config/environment';
import { LoginPage } from './LoginPage';

describe('LoginPage in the public demo', () => {
  afterEach(() => {
    clientEnvironment.VITE_DEMO = false;
    vi.unstubAllGlobals();
  });

  it('offers no demo sign-in outside the demo build', () => {
    render(
      <AppProviders>
        <LoginPage />
      </AppProviders>,
    );
    expect(screen.queryByRole('button', { name: esCL.auth.demoLogin })).not.toBeInTheDocument();
  });

  it('signs in as the demo supervisor through the CSRF token', async () => {
    clientEnvironment.VITE_DEMO = true;
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push(`${init?.method ?? 'GET'} ${url.replace(clientEnvironment.VITE_API_URL, '')}`);
        const body = url.endsWith('/auth/csrf')
          ? { token: 'csrf-token' }
          : {
              user: {
                id: '00000000-0000-4000-8000-000000000001',
                email: 'supervisor@faena.local',
                name: 'Supervisión',
                role: 'SUPERVISOR',
              },
            };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );
    render(
      <AppProviders>
        <LoginPage />
      </AppProviders>,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: esCL.auth.demoLogin }));
    await waitFor(() => expect(calls).toContain('POST /auth/demo'));
    expect(calls.indexOf('GET /auth/csrf')).toBeLessThan(calls.indexOf('POST /auth/demo'));
  });
});
