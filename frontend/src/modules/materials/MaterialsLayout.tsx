import { Box, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { MATERIALS_SECTIONS } from './constants/materials-sections.constants';

const BASE_PATH = '/materials';

export function MaterialsLayout() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const { pathname } = useLocation();
  const active = MATERIALS_SECTIONS.find((section) => pathname.startsWith(`${BASE_PATH}/${section.route}`));

  return (
    <Box sx={{ display: 'flex', flexDirection: desktop ? 'row' : 'column', gap: 3 }}>
      <Tabs
        orientation={desktop ? 'vertical' : 'horizontal'}
        variant="scrollable"
        value={active ? active.route : false}
        sx={{
          flexShrink: 0,
          borderRight: desktop ? 1 : 0,
          borderBottom: desktop ? 0 : 1,
          borderColor: 'divider',
          minWidth: desktop ? 200 : undefined,
          '& .MuiTab-root': { alignItems: desktop ? 'flex-start' : 'center', textAlign: 'left' },
        }}
      >
        {MATERIALS_SECTIONS.map((section) => (
          <Tab
            key={section.route}
            value={section.route}
            label={section.label}
            component={Link}
            to={`${BASE_PATH}/${section.route}`}
          />
        ))}
      </Tabs>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
