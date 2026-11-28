import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, Outlet, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

export function AdminLayout() {
  const auth = useAdminAuth();
  if (!auth.isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="sticky" color="secondary">
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ mr: 2, fontWeight: 600 }}>
            Admin
          </Typography>
          <Button color="inherit" component={RouterLink} to="/admin">
            Pages
          </Button>
          <Button color="inherit" component={RouterLink} to="/admin/settings">
            Settings
          </Button>
          <Button color="inherit" component={RouterLink} to="/admin/password">
            Password
          </Button>
          <Button color="inherit" component={RouterLink} to="/" sx={{ ml: 'auto' }}>
            Site
          </Button>
          <Button color="inherit" onClick={auth.logout}>
            Log out
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
