import { Grid } from '@mui/material';
import { ResultCard } from '@/shared/ui/calc';
import type { OtherMaterialIdentityProps } from './types/other-material-identity-props.type';

export function OtherMaterialIdentity({ selection }: OtherMaterialIdentityProps) {
  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <ResultCard label="Name" value={selection.label} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3, md: 2 }}>
        <ResultCard label="Formula" value={selection.displayFormula || selection.formula || '—'} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3, md: 2 }}>
        <ResultCard label="CAS" value={selection.cas ?? '—'} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3, md: 2 }}>
        <ResultCard label="Class" value={selection.className ?? '—'} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3, md: 3 }}>
        <ResultCard label="Group" value={selection.group ?? '—'} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <ResultCard label="Catalogue id" value={selection.id} />
      </Grid>
    </Grid>
  );
}
