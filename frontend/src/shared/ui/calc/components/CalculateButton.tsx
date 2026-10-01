import type { ReactNode } from 'react';
import { Button, CircularProgress } from '@mui/material';

type CalculateButtonProps = {
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  children?: ReactNode;
};

export function CalculateButton({ loading, disabled, onClick, type = 'submit', children = 'Calculate' }: CalculateButtonProps) {
  return (
    <Button
      type={type}
      variant="contained"
      size="large"
      onClick={onClick}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
    >
      {children}
    </Button>
  );
}
