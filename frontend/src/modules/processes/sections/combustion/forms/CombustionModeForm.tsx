import { useMemo } from 'react';
import { useGasList } from '../../../../materials';
import type { CombustionMode } from '../../../types/combustion-mode.type';
import { COMBUSTION_FIELDS } from '../constants/combustion-fields.constants';
import type { CombustionDrafts } from '../types/combustion-drafts.type';
import type { CombustionModeFormProps } from '../types/combustion-mode-form-props.type';
import { BedForm } from './BedForm';
import { FluidForm } from './FluidForm';
import { SupplyModeForm } from './SupplyModeForm';

export function CombustionModeForm({ mode, drafts, onChange, fuels }: CombustionModeFormProps) {
  const gasList = useGasList();
  const solidPresets = useMemo(() => fuels.filter((fuel) => fuel.phase === 'solid'), [fuels]);
  const gasPresets = useMemo(() => fuels.filter((fuel) => fuel.phase === 'gas'), [fuels]);
  const gasSpecies = useMemo(() => (gasList.data ?? []).filter((gas) => gas.formula !== null).map((gas) => gas.key), [gasList.data]);

  const setDraft = <M extends CombustionMode>(key: M) => (next: CombustionDrafts[M]) => onChange({ ...drafts, [key]: next });

  switch (mode) {
    case 'solid-direct':
      return <SupplyModeForm value={drafts[mode]} onChange={setDraft(mode)} presets={solidPresets} fields={COMBUSTION_FIELDS.solidDirect} />;
    case 'solid-two-step':
      return <SupplyModeForm value={drafts[mode]} onChange={setDraft(mode)} presets={solidPresets} fields={COMBUSTION_FIELDS.solidTwoStep} />;
    case 'fluid':
      return <FluidForm value={drafts.fluid} onChange={setDraft('fluid')} presets={gasPresets} gasSpecies={gasSpecies} />;
    case 'bed':
      return <BedForm value={drafts.bed} onChange={setDraft('bed')} presets={solidPresets} />;
  }
}
