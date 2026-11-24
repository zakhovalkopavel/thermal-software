import { Box, Button, Chip, Link, Paper, Stack, Typography } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import type { MaterialHeaderProps } from './types/material-header-props.type';

export function MaterialHeader({ material, groupLabels, canCompare, compared, onCompare }: MaterialHeaderProps) {
  const [primary, ...secondary] = material.materialGroup;
  const source = [material.supplier, material.grade].filter(Boolean).join(' · ');

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6">
            {material.name}{' '}
            <Typography component="span" variant="body2" color="text.secondary">
              ({material.materialId})
            </Typography>
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
            <Typography variant="body2">Category: {groupLabels[primary] ?? primary}</Typography>
            <Typography variant="body2" color="text.secondary">
              · also:
            </Typography>
            {secondary.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            ) : (
              secondary.map((group) => <Chip key={group} size="small" label={groupLabels[group] ?? group} />)
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {material.description}
          </Typography>
          {(source || material.sourceUrl) && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {source}
              {source && material.sourceUrl && ' · '}
              {material.sourceUrl && (
                <Link href={material.sourceUrl} target="_blank" rel="noopener noreferrer">
                  source
                </Link>
              )}
            </Typography>
          )}
        </Box>
        <Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CompareArrowsIcon />}
            disabled={compared || !canCompare}
            onClick={onCompare}
          >
            {compared ? 'In comparison' : 'Add to compare'}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
