import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

export function AdminLoginPage() {
  const auth = useAdminAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (auth.isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await auth.login(password);
    } catch {
      setError('Invalid password');
    } finally {
      setPending(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 420 }} component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <Typography variant="h5">Admin login</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            type="password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={pending || password.length < 8}>
            Sign in
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
