import { useEffect } from 'react';
import { useMix } from '../hooks/useMix';
import { usePacking } from '../hooks/usePacking';

/**
 * Always-mounted sync: recomputes CPM whenever every mix row is complete
 * (does not wait for Σ mass % = 100), and writes φ / porosity into mix state.
 */
export function PackingSync() {
  const { completeFractions, state, dispatch } = useMix();
  const packingReady =
    state.fractions.length > 0 && completeFractions.length === state.fractions.length;
  const { cpm, furnas } = usePacking(completeFractions, packingReady, null, null);

  useEffect(() => {
    if (!packingReady) return;
    if (state.packingModel === 'Furnas') {
      if (!furnas.data) return;
      const { packingFraction_phi: phi, porosity_initial: porosity } = furnas.data;
      if (state.phi === phi && state.porosity === porosity) return;
      dispatch({ type: 'setPacking', phi, porosity, packingModel: 'Furnas' });
      return;
    }
    if (!cpm.data) return;
    const { packingFraction_phi: phi, porosity_initial: porosity } = cpm.data;
    if (state.phi === phi && state.porosity === porosity && state.packingModel === 'CPM') return;
    dispatch({ type: 'setPacking', phi, porosity, packingModel: 'CPM' });
  }, [
    packingReady,
    cpm.data,
    furnas.data,
    state.packingModel,
    state.phi,
    state.porosity,
    dispatch,
  ]);

  return null;
}
