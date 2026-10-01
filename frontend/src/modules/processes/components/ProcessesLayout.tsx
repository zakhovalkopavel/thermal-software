import { Box, Stack, Tab, Tabs } from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { PROCESSES_SECTIONS } from '@/modules/processes/constants/processes-sections.constants';

const BASE_PATH = '/processes';

export function ProcessesLayout() {
  const { pathname } = useLocation();
  const active = PROCESSES_SECTIONS.find((section) => pathname.startsWith(`${BASE_PATH}/${section.route}`));

  return (
    <Stack spacing={3}>
      <Tabs variant="scrollable" scrollButtons="auto" value={active ? active.route : false} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {PROCESSES_SECTIONS.map((section) => (
          <Tab key={section.route} value={section.route} label={section.label} component={Link} to={`${BASE_PATH}/${section.route}`} />
        ))}
      </Tabs>
      <Box sx={{ minWidth: 0 }}>
        <Outlet />
      </Box>
    </Stack>
  );
}
