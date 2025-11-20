import { BACKEND_URLS } from './backend-urls';

export const API_ENDPOINTS = {
  auth: BACKEND_URLS.auth,
  api: BACKEND_URLS.api,
  yandexDirect: BACKEND_URLS['yandex-direct'],
  yandexOauth: BACKEND_URLS['yandex-oauth'],
  rsyaProjects: BACKEND_URLS['rsya-projects'],
  rsyaScheduler: BACKEND_URLS['rsya-scheduler'],
  wordstatStatus: BACKEND_URLS['wordstat-status'],
  wordstatParser: BACKEND_URLS['wordstat-parser'],
  subscription: BACKEND_URLS.subscription,
  admin: BACKEND_URLS.admin
} as const;