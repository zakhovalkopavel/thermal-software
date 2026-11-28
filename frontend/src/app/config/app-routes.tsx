import type { RouteObject } from 'react-router-dom';
import { RouteErrorBoundary } from '@/shared/ui/feedback/RouteErrorBoundary';
import { materialsRoutes } from '@/modules/materials';
import { processesRoutes } from '@/modules/processes';
import { adminRoutes } from '@/modules/admin/routes';
import { CmsContentPage } from '@/modules/cms/pages/CmsContentPage';
import { Home } from '@/pages/home/Home';
import { NotFound } from '@/pages/not-found/NotFound';
import { Layout } from '@/app/components/Layout';

export const appRoutes: RouteObject[] = [
  ...adminRoutes,
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <Home /> },
          ...materialsRoutes,
          ...processesRoutes,
          { path: 'about', element: <CmsContentPage /> },
          { path: 'overview', element: <CmsContentPage /> },
          { path: 'info/materials/*', element: <CmsContentPage /> },
          { path: 'info/processes/*', element: <CmsContentPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
];
