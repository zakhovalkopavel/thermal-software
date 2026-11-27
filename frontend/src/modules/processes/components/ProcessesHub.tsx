import { Grid, Stack, Typography } from '@mui/material';
import { PROCESSES_SECTION_ICONS } from '@/modules/processes/constants/processes-section-icons';
import { PROCESSES_SECTIONS } from '@/modules/processes/constants/processes-sections.constants';
import { SectionLinkCard } from '@/shared/ui/section-link-card/SectionLinkCard';

export function ProcessesHub() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Processes</Typography>
      <Typography color="text.secondary">
        Furnace tasks built on the Materials catalogues: combustion, heat loss through the wall, heat
        transfer, recuperation and transient heating.
      </Typography>
      <Grid container spacing={2}>
        {PROCESSES_SECTIONS.map((section) => {
          const Icon = PROCESSES_SECTION_ICONS[section.route];
          return (
            <Grid key={section.route} size={{ xs: 12, sm: 6, lg: 4 }}>
              <SectionLinkCard
                to={section.route}
                label={section.label}
                description={section.description}
                icon={<Icon fontSize="large" />}
              />
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
