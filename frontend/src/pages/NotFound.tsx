import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Page not found
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Go home
      </Button>
    </Box>
  );
}
