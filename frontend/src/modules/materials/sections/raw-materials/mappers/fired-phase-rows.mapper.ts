/** Fired phases sorted by decreasing share. */
export function toFiredPhaseRows(phases_wt: Record<string, number>): Array<{ phase: string; share_wt: number }> {
  return Object.entries(phases_wt)
    .map(([phase, share_wt]) => ({ phase, share_wt }))
    .sort((a, b) => b.share_wt - a.share_wt);
}
