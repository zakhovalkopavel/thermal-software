import type { RouteObject } from 'react-router-dom';

function join(base: string, path: string): string {
  if (path.startsWith('/')) return path;
  return `${base.replace(/\/$/, '')}/${path}`;
}

/** Every concrete path of the route tree, once (index routes map to their parent path; `*` is skipped). */
export function collectRoutePaths(routes: RouteObject[], base = ''): string[] {
  return [...new Set(collectAll(routes, base))];
}

function collectAll(routes: RouteObject[], base: string): string[] {
  return routes.flatMap((route) => {
    if (route.index) return [base || '/'];
    if (route.path === undefined || route.path === '*') return collectAll(route.children ?? [], base);
    const path = join(base, route.path);
    const children = collectAll(route.children ?? [], path);
    const renders = Boolean(route.element || route.Component || route.lazy);
    return renders && !route.children?.some((child) => child.index) ? [path, ...children] : children;
  });
}
