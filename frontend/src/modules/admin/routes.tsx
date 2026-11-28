import type { RouteObject } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { AdminAuthProvider } from './components/AdminAuthProvider';
import { AdminLayout } from './components/AdminLayout';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminPageEditPage } from './pages/AdminPageEditPage';
import { AdminPagesPage } from './pages/AdminPagesPage';
import { AdminPasswordPage } from './pages/AdminPasswordPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

function AdminAuthOutlet() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}

export const adminRoutes: RouteObject[] = [
  {
    element: <AdminAuthOutlet />,
    children: [
      { path: '/admin/login', element: <AdminLoginPage /> },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminPagesPage /> },
          { path: 'pages/edit', element: <AdminPageEditPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
          { path: 'password', element: <AdminPasswordPage /> },
        ],
      },
    ],
  },
];
