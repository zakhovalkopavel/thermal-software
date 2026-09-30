import { useMemo } from 'react';
import { useMetalList, useRefractoryProducts } from '../../materials';

/** Material id → catalogue name for metals and refractory products. */
export function useWallMaterialNames(): Map<string, string> {
  const metals = useMetalList();
  const refractories = useRefractoryProducts();
  return useMemo(
    () =>
      new Map([
        ...(metals.data ?? []).map((metal) => [metal.materialId, metal.name] as const),
        ...(refractories.data ?? []).map((product) => [product.materialId, product.name] as const),
      ]),
    [metals.data, refractories.data],
  );
}
