export const CMS_QUERY_KEYS = {
  page: (path: string) => ['cms', 'page', path] as const,
  pagesPrefix: (prefix: string) => ['cms', 'pages', prefix] as const,
  settings: ['cms', 'settings'] as const,
  adminPages: ['cms', 'admin', 'pages'] as const,
} as const;
