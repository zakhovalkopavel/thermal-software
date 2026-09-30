import { Button, Stack, Typography } from '@mui/material';
import { COMPOSITION_INPUT } from './composition-input.constants';
import { CompositionRows } from './CompositionRows';
import { roundComposition } from './round-composition';

type GasCompositionInputProps = {
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  species: readonly string[];
  fractionLabel?: string;
  readOnly?: boolean;
};

export function GasCompositionInput({
  value,
  onChange,
  species,
  fractionLabel = 'mole fraction',
  readOnly,
}: GasCompositionInputProps) {
  const sum = Object.values(value).reduce((total, amount) => total + amount, 0);
  const sumOff = Math.abs(sum - COMPOSITION_INPUT.fractionTotal) > COMPOSITION_INPUT.fractionSumTolerance;

  const normalize = () => {
    if (sum <= 0) return;
    const scaled = Object.fromEntries(Object.entries(value).map(([key, amount]) => [key, amount / sum]));
    onChange(roundComposition(scaled, COMPOSITION_INPUT.fractionDisplayDecimals));
  };

  return (
    <Stack spacing={1.5}>
      <CompositionRows
        value={value}
        onChange={onChange}
        options={species}
        freeKeys={false}
        readOnly={readOnly}
        unit=""
        keyLabel="Species"
        max={COMPOSITION_INPUT.fractionTotal}
        addLabel="Add species"
      />
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" color={sumOff ? 'warning.main' : 'text.secondary'}>
          Σ = {sum.toFixed(4)} ({fractionLabel})
          {sumOff && ' — must be 1'}
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
