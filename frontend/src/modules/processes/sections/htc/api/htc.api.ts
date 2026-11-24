import { api } from '@/shared/api/client';
import type { BodyGeometryInput } from '../types/body-geometry-input.type';
import type { BodyGeometryResult } from '../types/body-geometry-result.type';
import type { CorrelationInfo } from '../types/correlation-info.type';
import type { DimensionlessInput } from '../types/dimensionless-input.type';
import type { DimensionlessResult } from '../types/dimensionless-result.type';
import type { FlowGeometryInfo } from '../types/flow-geometry-info.type';
import type { FlowModeInfo } from '../types/flow-mode-info.type';

export const htcApi = {
  geometries: async (): Promise<FlowGeometryInfo[]> => (await api.get<FlowGeometryInfo[]>('/thermodynamics/geometry/list')).data,
  correlations: async (): Promise<CorrelationInfo[]> => (await api.get<CorrelationInfo[]>('/thermodynamics/correlations')).data,
  flowModes: async (): Promise<FlowModeInfo[]> => (await api.get<FlowModeInfo[]>('/thermodynamics/fluid/flow-modes')).data,
  dimensionless: async (input: DimensionlessInput): Promise<DimensionlessResult> =>
    (await api.post<DimensionlessResult>('/thermodynamics/dimensionless', input)).data,
  bodyGeometry: async (input: BodyGeometryInput): Promise<BodyGeometryResult> =>
    (await api.post<BodyGeometryResult>('/thermodynamics/body-geometry', input)).data,
};
