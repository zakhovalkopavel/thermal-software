import type { ReactNode } from 'react';

export type ResultTableColumn<T> = {
  key: string;
  label: ReactNode;
  unit?: string;
  digits?: number;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
};
