import func2url from '../../backend/func2url.json';

export const API_ENDPOINTS = {
  auth: func2url.auth,
  api: func2url.api,
  yandexDirect: func2url['yandex-direct'],
  yandexOauth: func2url['yandex-oauth'],
  rsyaProjects: func2url['rsya-projects'],
  wordstatStatus: func2url['wordstat-status'],
  wordstatParser: func2url['wordstat-parser'],
  subscription: func2url.subscription,
  admin: func2url.admin
} as const;
