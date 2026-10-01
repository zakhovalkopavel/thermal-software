import type { RouteObject } from 'react-router-dom';

function join(base: string, path: string): string {
  if (path.startsWith('/')) return path;
  return `${base.replace(/\/$/, '')}/${path}`;
}

/** Every concrete path of the route tree (index routes map to their parent path; `*` is skipped). */
export function collectRoutePaths(routes: RouteObject[], base = ''): string[] {
  return routes.flatMap((route) => {
    if (route.index) return [base || '/'];
    if (route.path === undefined || route.path === '*') return collectRoutePaths(route.children ?? [], base);
    const path = join(base, route.path);
    const children = collectRoutePaths(route.children ?? [], path);
    return route.element && !route.children?.some((child) => child.index) ? [path, ...children] : children;
  });
}
