import { Box, Grid, Stack, Typography } from '@mui/material';
import { MATERIALS_SECTION_ICONS } from '@/modules/materials/constants/materials-section-icons';
import { MATERIALS_SECTIONS } from '@/modules/materials/constants/materials-sections.constants';
import { PROCESSES_SECTION_ICONS } from '@/modules/processes/constants/processes-section-icons';
import { PROCESSES_SECTIONS } from '@/modules/processes/constants/processes-sections.constants';
import { SectionLinkCard } from '@/shared/ui/section-link-card/SectionLinkCard';
import { HealthWidget } from './components/HealthWidget';

export function Home() {
  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Engineering calculations
        </Typography>
        <Typography color="text.secondary">
          Pick a material or a process, set the conditions and calculate.
        </Typography>
      </Box>

      <Stack spacing={2}>
        <Typography variant="h5">Materials</Typography>
        <Typography color="text.secondary">
          What a material is and what its properties are.
        </Typography>
        <Grid container spacing={2}>
          {MATERIALS_SECTIONS.map((section) => {
            const Icon = MATERIALS_SECTION_ICONS[section.route];
            return (
              <Grid key={section.route} size={{ xs: 12, sm: 6, lg: 4 }}>
                <SectionLinkCard
                  to={`/materials/${section.route}`}
                  label={section.label}
                  description={section.description}
                  icon={<Icon fontSize="large" />}
                />
              </Grid>
            );
          })}
        </Grid>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5">Processes</Typography>
        <Typography color="text.secondary">
          Furnace and heat-transfer tasks that use materials.
        </Typography>
        <Grid container spacing={2}>
          {PROCESSES_SECTIONS.map((section) => {
            const Icon = PROCESSES_SECTION_ICONS[section.route];
            return (
              <Grid key={section.route} size={{ xs: 12, sm: 6, lg: 4 }}>
                <SectionLinkCard
                  to={`/processes/${section.route}`}
                  label={section.label}
                  description={section.description}
                  icon={<Icon fontSize="large" />}
                />
              </Grid>
            );
          })}
        </Grid>
      </Stack>

      <HealthWidget />
    </Stack>
  );
}
