/** Labels for the phase-equilibrium summary (liquid vs unreacted amorphous cores). */
export const PHASE_EQUILIBRIUM_UI = {
  empty: '—',
  liquidTitle: 'Liquid (matrix melt)',
  unreactedGlassBarLabel: 'Unreacted glass (cores)',
  unreactedGlassTitle: 'Unreacted amorphous cores',
  unreactedGlassHint:
    'Amorphous remainder left inside coarse grains that did not fully react (shrinking-core shells). Not the same as the matrix melt.',
  quenchedGlassTitle: 'Glass after cooling (quenched matrix liquid)',
  crystalsTitle: 'Crystals',
} as const;
