export type ParticipationResult = {
  totalParticipation: number;
  normalizedParticipation: Array<{
    fractionIndex: number;
    dMin_mm: number;
    dMax_mm: number;
    dMean_mm: number;
    massFraction: number;
    participationFactor: number;
    effectiveParticipation: number;
    normalizedParticipation: number;
  }>;
};
