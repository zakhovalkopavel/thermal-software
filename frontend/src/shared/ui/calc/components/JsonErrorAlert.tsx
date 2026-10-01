import { Alert, AlertTitle, Box } from '@mui/material';
import { apiErrorMessages } from '@/shared/ui/calc/mappers/api-error-messages';

type JsonErrorAlertProps = {
  error: unknown;
};

export function JsonErrorAlert({ error }: JsonErrorAlertProps) {
  const { title, messages } = apiErrorMessages(error);
  return (
    <Alert severity="error">
      <AlertTitle>{title}</AlertTitle>
      {messages.length === 1 ? (
        messages[0]
      ) : (
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </Box>
      )}
    </Alert>
  );
}
