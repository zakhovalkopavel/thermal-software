import { Alert, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { healthApi } from '@/shared/api/health.api';

export function HealthWidget() {
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.get,
    retry: false,
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">System status</Typography>
          {isFetching && <CircularProgress size={24} />}
          {!isFetching && error && (
            <Alert severity="error">Backend is not reachable.</Alert>
          )}
          {!isFetching && data && (
            <Alert severity="success">
              Backend API: {data.status} — {new Date(data.timestamp).toLocaleString()}
            </Alert>
          )}
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={() => refetch()} disabled={isFetching}>
              Refresh
            </Button>
            <Button variant="outlined" href="/api/docs" target="_blank" rel="noreferrer">
              API documentation
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
