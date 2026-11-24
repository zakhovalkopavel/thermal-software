import { useState } from 'react';
import { Alert, Button, CircularProgress, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { compositionApi } from '@/shared/api/composition.api';
import { COMPOSITION_INPUT } from '@/shared/ui/calc/constants/composition-input.constants';
import type { CompositionUnit } from '@/shared/ui/calc/types/composition-unit.type';
import { CompositionRows } from './CompositionRows';
import { GLASS_OXIDES } from '@/shared/ui/calc/constants/glass-oxides.constants';
import { JsonErrorAlert } from './JsonErrorAlert';
import { roundComposition } from '@/shared/ui/calc/formatters/round-composition';

type OxideCompositionInputProps = {
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  unit: CompositionUnit;
  onUnitChange?: (unit: CompositionUnit) => void;
  allowedOxides?: readonly string[];
  readOnly?: boolean;
};

export function OxideCompositionInput({
  value,
  onChange,
  unit,
  onUnitChange,
  allowedOxides,
  readOnly,
}: OxideCompositionInputProps) {
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<unknown>(null);
  const [dropped, setDropped] = useState<string[]>([]);

  const sum = Object.values(value).reduce((total, amount) => total + amount, 0);
  const sumOff = Math.abs(sum - COMPOSITION_INPUT.percentTotal) > COMPOSITION_INPUT.percentSumTolerance;

  const normalize = () => {
    if (sum <= 0) return;
    const scaled = Object.fromEntries(
      Object.entries(value).map(([key, amount]) => [key, (amount * COMPOSITION_INPUT.percentTotal) / sum]),
    );
    onChange(roundComposition(scaled, COMPOSITION_INPUT.displayDecimals));
  };

  const switchUnit = async (next: CompositionUnit | null) => {
    if (!next || next === unit || !onUnitChange) return;
    setConvertError(null);
    setDropped([]);
    const nonZero = Object.fromEntries(Object.entries(value).filter(([, amount]) => amount > 0));
    if (Object.keys(nonZero).length === 0) {
      onUnitChange(next);
      return;
    }
    setConverting(true);
    try {
      const result = await compositionApi.convert(nonZero, unit === 'wt' ? 'wt_to_mol' : 'mol_to_wt');
      setDropped(Object.keys(nonZero).filter((key) => !(key in result.output)));
      onChange(roundComposition(result.output, COMPOSITION_INPUT.displayDecimals));
      onUnitChange(next);
    } catch (error) {
      setConvertError(error);
    } finally {
      setConverting(false);
    }
  };

  const unitLabel = unit === 'wt' ? 'wt%' : 'mol%';

  return (
    <Stack spacing={1.5}>
      {onUnitChange && (
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup size="small" exclusive value={unit} onChange={(_, next) => switchUnit(next)} disabled={converting}>
            <ToggleButton value="wt">wt%</ToggleButton>
            <ToggleButton value="mol">mol%</ToggleButton>
          </ToggleButtonGroup>
          {converting && <CircularProgress size={18} />}
        </Stack>
      )}
      {convertError ? <JsonErrorAlert error={convertError} /> : null}
      {dropped.length > 0 && (
        <Alert severity="warning">Not converted (unknown molar mass), removed: {dropped.join(', ')}</Alert>
      )}
      <CompositionRows
        value={value}
        onChange={onChange}
        options={allowedOxides ?? GLASS_OXIDES}
        freeKeys={!allowedOxides}
        readOnly={readOnly}
        unit="%"
        keyLabel="Oxide"
        max={COMPOSITION_INPUT.percentTotal}
        addLabel="Add oxide"
      />
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" color={sumOff ? 'warning.main' : 'text.secondary'}>
          Σ = {sum.toFixed(2)} {unitLabel}
          {sumOff && ' — should be 100'}
        </Typography>
        {!readOnly && (
          <Button size="small" onClick={normalize} disabled={sum <= 0}>
            Normalize
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
