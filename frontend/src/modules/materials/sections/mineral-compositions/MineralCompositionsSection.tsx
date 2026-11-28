import { Box, Stack, Typography } from '@mui/material';
import { SectionIntro } from '@/modules/cms/components/SectionIntro';
import { SECTION_INFO_PATHS } from '@/modules/cms/constants/section-info-paths.constants';
import { MixProvider } from './mix/MixContext';
import { MixWorkspace } from './MixWorkspace';

const FALLBACK_RESUME =
  'Build a refractory mix from library materials and size fractions, then analyse its chemistry, granulometry, packing, water demand and shrinkage, and optimise the blend.';

export function MineralCompositionsSection() {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">Mineral compositions</Typography>
        <SectionIntro infoPath={SECTION_INFO_PATHS.mineralCompositions} fallbackResume={FALLBACK_RESUME} />
      </Box>
      <MixProvider>
        <MixWorkspace />
      </MixProvider>
    </Stack>
  );
}
