import { useQuery } from '@tanstack/react-query';
import { esCL } from '@faena/contracts';
import { useEffect, useState } from 'react';
import { api } from './api';
import { WAKE_RETRIES, isWaking } from './wake';
import { authQueryKeys } from './features/auth/query-keys';
import { LoginPage } from './features/auth/LoginPage';
import { Panel } from './features/layout/Panel';
import { PageState } from './components/PageState';

function useSlow(active: boolean, afterMs = 2500): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setSlow(true), afterMs);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [active, afterMs]);
  return slow;
}

function App() {
  const me = useQuery({
    queryKey: authQueryKeys.me,
    queryFn: api.me,
    retry: (failures, error) => isWaking(error) && failures < WAKE_RETRIES,
    retryDelay: 3000,
  });
  const slow = useSlow(me.isPending);
  if (me.isPending)
    return slow || me.failureCount > 0 ? (
      <PageState title={esCL.auth.waking} text={esCL.auth.wakingText} />
    ) : (
      <PageState title={esCL.auth.loadingTitle} text={esCL.auth.loadingText} />
    );
  if (me.isError || !me.data) return <LoginPage />;
  return <Panel user={me.data} />;
}

export default App;
