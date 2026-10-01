import { Box, CircularProgress } from '@mui/material';

export function RouteFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress aria-label="Loading page" />
    </Box>
  );
}
