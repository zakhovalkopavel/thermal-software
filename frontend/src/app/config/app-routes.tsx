import type { RouteObject } from 'react-router-dom';
import { RouteErrorBoundary } from '@/shared/ui/feedback/RouteErrorBoundary';
import { materialsRoutes } from '@/modules/materials';
import { processesRoutes } from '@/modules/processes';
import { Home } from '@/pages/home/Home';
import { NotFound } from '@/pages/not-found/NotFound';
import { Layout } from '@/app/components/Layout';

export const appRoutes: RouteObject[] = [
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
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
];
