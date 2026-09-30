import type { ParticleSizes } from '../../../types/particle-sizes.type';
import { PARTICLE_SIZE_GROUP_LABELS } from '../constants/particle-size-group-labels.constants';
import type { SizeOption } from '../types/size-option.type';

const AVAILABLE_GROUP_LABEL = 'Available for this material';

/** The material's available sizes first, then every class of the catalogue by group. */
export function toSizeOptions(sizes: ParticleSizes | undefined, availableCodes: string[] = []): SizeOption[] {
  if (!sizes) return [];
  const all = (Object.keys(PARTICLE_SIZE_GROUP_LABELS) as (keyof ParticleSizes)[]).flatMap((group) =>
    Object.entries(sizes[group] ?? {}).map(([code, range]) => ({
      key: `${group}:${code}`,
      code,
      groupLabel: PARTICLE_SIZE_GROUP_LABELS[group],
      range,
    })),
  );
  const available = availableCodes.flatMap((code) => {
    const option = all.find((item) => item.code === code);
    return option ? [{ ...option, groupLabel: AVAILABLE_GROUP_LABEL }] : [];
  });
  const availableKeys = new Set(available.map((option) => option.key));
  return [...available, ...all.filter((option) => !availableKeys.has(option.key))];
}
