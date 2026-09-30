import { createBrowserRouter } from 'react-router-dom';
import { materialsRoutes } from '../modules/materials';
import { processesRoutes } from '../modules/processes';
import { Home } from '../pages/Home';
import { NotFound } from '../pages/NotFound';
import { Layout } from './Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      ...materialsRoutes,
      ...processesRoutes,
      { path: '*', element: <NotFound /> },
    ],
  },
]);
