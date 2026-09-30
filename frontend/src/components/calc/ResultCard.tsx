import type { ReactNode } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { formatValue } from './format';

type ResultCardProps = {
  label: ReactNode;
  value: number | string | null | undefined;
  unit?: string;
  digits?: number;
  hint?: ReactNode;
};

export function ResultCard({ label, value, unit, digits = 4, hint }: ResultCardProps) {
  const text = typeof value === 'number' || value === null || value === undefined ? formatValue(value, digits) : value;
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" color="text.secondary" component="div">
          {label}
        </Typography>
        <Typography variant="h6" component="div">
          {text}
          {unit && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              {unit}
            </Typography>
          )}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary" component="div">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
