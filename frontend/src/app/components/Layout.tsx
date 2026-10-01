import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { NavLink, Outlet } from 'react-router-dom';
import { APP_NAV } from '@/app/constants/app-nav.constants';

export function Layout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ mr: 4, fontWeight: 600 }}>
            Thermal Software
          </Typography>
          {APP_NAV.map((item) => (
            <Button
              key={item.path}
              component={NavLink}
              to={item.path}
              end={item.end}
              color="inherit"
              sx={{ '&.active': { bgcolor: 'rgba(255,255,255,0.18)' } }}
            >
              {item.label}
            </Button>
          ))}
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
