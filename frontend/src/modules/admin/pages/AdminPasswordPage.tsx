import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { adminChangePassword } from '../api/admin.api';

export function AdminPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      await adminChangePassword(currentPassword, newPassword);
      setMessage('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setError('Could not change password');
    } finally {
      setPending(false);
    }
  };

  return (
    <Stack component="form" spacing={2} maxWidth={420} onSubmit={onSubmit}>
      <Typography variant="h5">Change password</Typography>
      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        type="password"
        label="Current password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        fullWidth
      />
      <TextField
        type="password"
        label="New password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        disabled={pending || currentPassword.length < 8 || newPassword.length < 8}
      >
        Update password
      </Button>
    </Stack>
  );
}
