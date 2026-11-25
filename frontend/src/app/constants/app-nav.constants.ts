export const APP_NAV = [
  { path: '/', label: 'Home', end: true },
  { path: '/materials', label: 'Materials', end: false },
  { path: '/processes', label: 'Processes', end: false },
] as const;

/** Same-origin SE GUI (nginx `/source-extractor/`). */
export const SOURCE_EXTRACTOR_URL =
  import.meta.env.VITE_SOURCE_EXTRACTOR_URL ?? '/source-extractor/';
