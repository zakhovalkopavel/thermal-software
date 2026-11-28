import { Box, Grid, Stack, Typography } from '@mui/material';
import { MATERIALS_SECTION_ICONS } from '@/modules/materials/constants/materials-section-icons';
import { MATERIALS_SECTIONS } from '@/modules/materials/constants/materials-sections.constants';
import { PROCESSES_SECTION_ICONS } from '@/modules/processes/constants/processes-section-icons';
import { PROCESSES_SECTIONS } from '@/modules/processes/constants/processes-sections.constants';
import { useCmsPage } from '@/modules/cms/hooks/useCmsPage';
import { useCmsPagesPrefix } from '@/modules/cms/hooks/useCmsPagesPrefix';
import { SectionLinkCard } from '@/shared/ui/section-link-card/SectionLinkCard';
import { HealthWidget } from './components/HealthWidget';

export function Home() {
  const home = useCmsPage('/');
  const materialsPages = useCmsPagesPrefix('/materials');
  const processesPages = useCmsPagesPrefix('/processes');
  const resumeByPath = new Map(
    [...(materialsPages.data ?? []), ...(processesPages.data ?? [])].map((page) => [page.path, page.resume]),
  );

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" gutterBottom>
          {home.data?.title || 'Engineering calculations'}
        </Typography>
        <Typography color="text.secondary">
          {home.data?.resume ||
            'Pick a material or a process, set the conditions and calculate.'}
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
            const path = `/materials/${section.route}`;
            return (
              <Grid key={section.route} size={{ xs: 12, sm: 6, lg: 4 }}>
                <SectionLinkCard
                  to={path}
                  label={section.label}
                  description={resumeByPath.get(path) || section.description}
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
            const path = `/processes/${section.route}`;
            return (
              <Grid key={section.route} size={{ xs: 12, sm: 6, lg: 4 }}>
                <SectionLinkCard
                  to={path}
                  label={section.label}
                  description={resumeByPath.get(path) || section.description}
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
