import { Box, Stack, Typography } from '@mui/material';
import { MixProvider } from './mix/MixContext';
import { MixWorkspace } from './MixWorkspace';

export function MineralCompositionsSection() {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">Mineral compositions</Typography>
        <Typography color="text.secondary">
          Build a refractory mix from library materials and size fractions, then analyse its chemistry, granulometry, packing, water demand and
          shrinkage, and optimise the blend.
        </Typography>
      </Box>
      <MixProvider>
        <MixWorkspace />
      </MixProvider>
    </Stack>
  );
}
