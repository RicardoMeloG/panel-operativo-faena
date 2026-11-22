import { ApiError } from './api';

// A server that is waking up answers with a gateway error or not at all; a
// 401 means it is awake and there is no session. Retry only the first kind,
// for about two minutes.
export const WAKE_RETRIES = 40;
export const isWaking = (error: unknown) =>
  error instanceof TypeError ||
  (error instanceof ApiError && [502, 503, 504].includes(error.status));
