import { useMemo, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, Grid, Paper, Stack, Typography } from '@mui/material';
import { CalculatorPage, JsonErrorAlert } from '../../../../components/calc';
import { useMaterial } from '../../hooks/useMaterial';
import { useMaterialCategories } from '../../hooks/useMaterialCategories';
import { useMixComponents } from '../../hooks/useMixComponents';
import { useSearchParamsPatch } from '../../hooks/useSearchParamsPatch';
import type { MaterialEntry } from '../../types/material-entry.type';
import type { MaterialGroup } from '../../types/material-group.type';
import { CalculatedThermalCard } from './CalculatedThermalCard';
import { MaterialCategoryList } from './MaterialCategoryList';
import { MaterialCompositionCard } from './MaterialCompositionCard';
import { MaterialHeader } from './MaterialHeader';
import { RawMaterialCompare } from './RawMaterialCompare';
import { ReferencePropertiesCard } from './ReferencePropertiesCard';
import { RAW_MATERIALS_UI } from './constants/raw-materials-ui.constants';

export function RawMaterialsSection() {
  const [params, patchParams] = useSearchParamsPatch();
  const categoryParam = params.get('category');
  const materialParam = params.get('material');
  const categories = useMaterialCategories();
  const mixComponents = useMixComponents();
  const [compare, setCompare] = useState<string[]>([]);
  const [expandedOverride, setExpandedOverride] = useState<MaterialGroup | null | undefined>(undefined);

  const categoryList = useMemo(() => categories.data ?? [], [categories.data]);
  const entries = useMemo(
    () => new Map(categoryList.flatMap((category) => category.materials.map((entry) => [entry.materialId, entry] as const))),
    [categoryList],
  );
  const categoryOf = useMemo(
    () =>
      new Map(categoryList.flatMap((category) => category.materials.map((entry) => [entry.materialId, category.group] as const))),
    [categoryList],
  );
  const groupLabels = useMemo(
    () => Object.fromEntries(categoryList.map((category) => [category.group, category.label])) as Partial<Record<MaterialGroup, string>>,
    [categoryList],
  );
  const eligibleIds = useMemo(
    () => new Set((mixComponents.data ?? []).flatMap((category) => category.materials.map((entry) => entry.materialId))),
    [mixComponents.data],
  );

  const knownCategory = categoryList.find((category) => category.group === categoryParam)?.group ?? null;
  const selectedId = materialParam && entries.has(materialParam) ? materialParam : null;
  const expanded =
    expandedOverride !== undefined ? expandedOverride : (knownCategory ?? (selectedId ? categoryOf.get(selectedId) : null) ?? null);
  const unknownParams = categories.data
    ? [
        categoryParam && !knownCategory ? `category “${categoryParam}”` : null,
        materialParam && !selectedId ? `material “${materialParam}”` : null,
      ].filter(Boolean)
    : [];

  const material = useMaterial(selectedId);
  const compared = useMemo(
    () => compare.map((id) => entries.get(id)).filter((entry): entry is MaterialEntry => Boolean(entry)),
    [compare, entries],
  );
  const comparedEligible = useMemo(
    () => compared.filter((entry) => entry.materialId !== selectedId && eligibleIds.has(entry.materialId)),
    [compared, selectedId, eligibleIds],
  );

  const expand = (group: MaterialGroup | null) => {
    setExpandedOverride(group);
    patchParams({ category: group });
  };
  const select = (materialId: string, group: MaterialGroup) => {
    setExpandedOverride(group);
    patchParams({ category: group, material: materialId });
  };

  const details = (() => {
    if (!selectedId) return <Typography color="text.secondary">Select a material on the left.</Typography>;
    if (material.isLoading || mixComponents.isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (!material.data) return <JsonErrorAlert error={material.error} />;
    const entry = material.data;
    return (
      <>
        <MaterialHeader
          material={entry}
          groupLabels={groupLabels}
          canCompare={compare.length < RAW_MATERIALS_UI.maxCompared}
          compared={compare.includes(entry.materialId)}
          onCompare={() => setCompare((current) => [...current, entry.materialId])}
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <MaterialCompositionCard composition={entry.composition} />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <ReferencePropertiesCard material={entry} />
            </Paper>
          </Grid>
        </Grid>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <CalculatedThermalCard
            key={entry.materialId}
            material={entry}
            eligible={eligibleIds.has(entry.materialId)}
            comparedEligible={comparedEligible}
          />
        </Paper>
      </>
    );
  })();

  return (
    <CalculatorPage
      title="Raw materials"
      description="Material library by category: composition, library reference values and calculated λ, Cp, ρ, a versus temperature."
      inputs={
        <Stack spacing={2}>
          {unknownParams.length > 0 && <Alert severity="info">Unknown {unknownParams.join(' and ')} in the link — ignored.</Alert>}
          {categories.error ? <JsonErrorAlert error={categories.error} /> : null}
          {categories.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <MaterialCategoryList
              categories={categoryList}
              expanded={expanded}
              onExpand={expand}
              selectedId={selectedId}
              onSelect={select}
            />
          )}
          <Box>
            <Typography variant="subtitle2">
              Compare (≤ {RAW_MATERIALS_UI.maxCompared})
            </Typography>
            {compared.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Use “Add to compare” on a material.
              </Typography>
            ) : (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {compared.map((entry) => (
                  <Chip
                    key={entry.materialId}
                    size="small"
                    label={entry.name}
                    onClick={() => select(entry.materialId, categoryOf.get(entry.materialId) ?? entry.materialGroup[0])}
                    onDelete={() => setCompare((current) => current.filter((id) => id !== entry.materialId))}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      }
      results={
        <Stack spacing={2}>
          {details}
          {compared.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <RawMaterialCompare materials={compared} />
            </Paper>
          )}
        </Stack>
      }
    />
  );
}
