import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error);
  const stack = import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Something went wrong
      </Typography>
      <Alert severity="error" sx={{ mb: 2 }}>
        {message}
      </Alert>
      {stack && (
        <Box component="details" sx={{ mb: 2 }}>
          <Box component="summary" sx={{ cursor: 'pointer', color: 'text.secondary' }}>
            Stack trace
          </Box>
          <Typography component="pre" variant="caption" sx={{ display: 'block', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {stack}
          </Typography>
        </Box>
      )}
      <Stack direction="row" spacing={2}>
        <Button component={Link} to="/" variant="contained">
          Back to home
        </Button>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </Stack>
    </Box>
  );
}
