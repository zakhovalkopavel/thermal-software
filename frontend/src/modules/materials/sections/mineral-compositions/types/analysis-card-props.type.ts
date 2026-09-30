import type { ReactNode } from 'react';

export type AnalysisCardProps = {
  title: string;
  loading?: boolean;
  error?: unknown;
  hasResult: boolean;
  idleText?: string;
  children?: ReactNode;
};
