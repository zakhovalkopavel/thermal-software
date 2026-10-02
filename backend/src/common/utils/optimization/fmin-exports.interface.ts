export interface FminExports {
  nelderMead(
    f: (x: number[]) => number,
    x0: number[],
    params?: { maxIterations?: number; tolerance?: number },
  ): { x: number[]; fx: number };

  conjugateGradient(
    f: (x: number[], grad: number[]) => number,
    x0: number[],
    params?: { maxIterations?: number },
  ): { x: number[]; fx: number };
}
