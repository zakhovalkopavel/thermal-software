export interface Equation<T> {
  calculate(x: number, vars: T, min: number, max: number, k?: number): number;
  calculateAverage(x1: number, x2: number, vars: T, min: number, max: number, k?: number): number;
  integral(x: number, vars: T, min: number, max: number, k?: number): number;
}

