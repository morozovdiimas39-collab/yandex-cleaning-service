import { BACKEND_URLS } from '@/config/backend-urls';

const ADMIN_SESSION_KEY = 'directkit_admin_session';

export interface AdminSession {
  token: string;
  username: string;
  expires_at: string;
  must_change_password: boolean;
}

export const getAdminSession = (): AdminSession | null => {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session.token || new Date(session.expires_at).getTime() <= Date.now()) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
};

export const setAdminSession = (session: AdminSession) => {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
};

export const clearAdminSession = () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event('admin-session-expired'));
};

export const adminAuthRequest = async (body: Record<string, unknown>) => {
  const session = getAdminSession();
  const requestBody = session?.token
    ? { ...body, session_token: session.token }
    : body;

  return fetch(BACKEND_URLS['admin-auth'], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    cache: 'no-store',
  });
};

export const adminFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const session = getAdminSession();
  if (!session) {
    clearAdminSession();
    throw new Error('Admin session required');
  }

  const headers = new Headers(init.headers || {});
  headers.set('X-Admin-Session', session.token);

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 || response.status === 403) {
    clearAdminSession();
  }
  return response;
};

export const logoutAdmin = async () => {
  try {
    await adminAuthRequest({ action: 'logout' });
  } finally {
    clearAdminSession();
  }
};
