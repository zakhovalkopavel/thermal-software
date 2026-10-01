import type { RouteObject } from 'react-router-dom';
import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary';
import { materialsRoutes } from '../modules/materials';
import { processesRoutes } from '../modules/processes';
import { Home } from '../pages/Home';
import { NotFound } from '../pages/NotFound';
import { Layout } from './Layout';

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
