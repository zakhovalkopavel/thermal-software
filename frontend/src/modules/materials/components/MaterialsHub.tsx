import { Grid, Stack, Typography } from '@mui/material';
import { useCmsPage } from '@/modules/cms/hooks/useCmsPage';
import { useCmsPagesPrefix } from '@/modules/cms/hooks/useCmsPagesPrefix';
import { MATERIALS_SECTION_ICONS } from '@/modules/materials/constants/materials-section-icons';
import { MATERIALS_SECTIONS } from '@/modules/materials/constants/materials-sections.constants';
import { SectionLinkCard } from '@/shared/ui/section-link-card/SectionLinkCard';

export function MaterialsHub() {
  const hub = useCmsPage('/materials');
  const pages = useCmsPagesPrefix('/materials');
  const resumeByPath = new Map((pages.data ?? []).map((page) => [page.path, page.resume]));

  return (
    <Stack spacing={2}>
      <Typography variant="h5">{hub.data?.title || 'Materials'}</Typography>
      <Typography color="text.secondary">
        {hub.data?.resume ||
          'Each section selects its own kind of material, sets the conditions and calculates the properties that kind has.'}
      </Typography>
      <Grid container spacing={2}>
        {MATERIALS_SECTIONS.map((section) => {
          const Icon = MATERIALS_SECTION_ICONS[section.route];
          const path = `/materials/${section.route}`;
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
