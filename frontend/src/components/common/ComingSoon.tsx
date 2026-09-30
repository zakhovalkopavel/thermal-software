import { Alert, Box, Typography } from '@mui/material';

type ComingSoonProps = {
  title: string;
  step: number;
};

export function ComingSoon({ title, step }: ComingSoonProps) {
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Alert severity="info">Coming in Step {step}.</Alert>
    </Box>
  );
}
