import { Grid, Stack, Typography } from '@mui/material';
import { useCmsPage } from '@/modules/cms/hooks/useCmsPage';
import { useCmsPagesPrefix } from '@/modules/cms/hooks/useCmsPagesPrefix';
import { PROCESSES_SECTION_ICONS } from '@/modules/processes/constants/processes-section-icons';
import { PROCESSES_SECTIONS } from '@/modules/processes/constants/processes-sections.constants';
import { SectionLinkCard } from '@/shared/ui/section-link-card/SectionLinkCard';

export function ProcessesHub() {
  const hub = useCmsPage('/processes');
  const pages = useCmsPagesPrefix('/processes');
  const resumeByPath = new Map((pages.data ?? []).map((page) => [page.path, page.resume]));

  return (
    <Stack spacing={2}>
      <Typography variant="h5">{hub.data?.title || 'Processes'}</Typography>
      <Typography color="text.secondary">
        {hub.data?.resume ||
          'Furnace tasks built on the Materials catalogues: combustion, heat loss through the wall, heat transfer, recuperation and transient heating.'}
      </Typography>
      <Grid container spacing={2}>
        {PROCESSES_SECTIONS.map((section) => {
          const Icon = PROCESSES_SECTION_ICONS[section.route];
          const path = `/processes/${section.route}`;
          return (
            <Grid key={section.route} size={{ xs: 12, sm: 6, lg: 4 }}>
              <SectionLinkCard
                to={section.route}
                label={section.label}
                description={resumeByPath.get(path) || section.description}
                icon={<Icon fontSize="large" />}
              />
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
