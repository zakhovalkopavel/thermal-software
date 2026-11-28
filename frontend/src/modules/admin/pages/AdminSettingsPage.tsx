import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { CMS_QUERY_KEYS } from '@/modules/cms/constants/cms-query-keys.constants';
import { adminGetSettings, adminUpdateSettings } from '../api/admin.api';

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: CMS_QUERY_KEYS.settings,
    queryFn: adminGetSettings,
  });
  const [gaMeasurementId, setGaMeasurementId] = useState('');
  const [siteName, setSiteName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings.data) {
      setGaMeasurementId(settings.data.gaMeasurementId || '');
      setSiteName(settings.data.siteName || '');
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () => adminUpdateSettings({ gaMeasurementId, siteName }),
    onSuccess: async () => {
      setMessage('Saved');
      await queryClient.invalidateQueries({ queryKey: CMS_QUERY_KEYS.settings });
    },
    onError: () => setMessage('Save failed'),
  });

  return (
    <Stack spacing={2} maxWidth={520}>
      <Typography variant="h5">Site settings</Typography>
      {message ? <Alert severity={message === 'Saved' ? 'success' : 'error'}>{message}</Alert> : null}
      <TextField
        label="Site name"
        value={siteName}
        onChange={(event) => setSiteName(event.target.value)}
        fullWidth
      />
      <TextField
        label="Google Analytics Measurement ID"
        placeholder="G-XXXXXXXX"
        helperText="Leave empty to disable Analytics"
        value={gaMeasurementId}
        onChange={(event) => setGaMeasurementId(event.target.value.toUpperCase())}
        fullWidth
      />
      <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending}>
        Save
      </Button>
    </Stack>
  );
}
