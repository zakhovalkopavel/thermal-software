import { Equation } from '../interfaces/equation.interface';

/**
 * DIPPR correlation 102:
 * λ (or μ) = c1 · T^c2 / (1 + c3/T + c4/T²)
 */
export interface DipprN102Vars { c1: number; c2: number; c3: number; c4: number; }

export class DipprEquation102Method implements Equation<DipprN102Vars> {
  calculate(x: number, vars: DipprN102Vars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    const { c1, c2, c3, c4 } = vars;
    return (c1 * Math.pow(x, c2) / (1 + c3 / x + c4 / (x * x))) * k;
  }
  integral(x: number, vars: DipprN102Vars, min: number, max: number, k = 1): number {
    // Numerical integral (no closed form for general c2)
    x = Math.min(Math.max(x, min), max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), min, x);
  }
  calculateAverage(x1: number, x2: number, vars: DipprN102Vars, min: number, max: number, k = 1): number {
    x1 = Math.min(Math.max(x1, min), max);
    x2 = Math.min(Math.max(x2, min), max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}

const GL20_NODES = [
  -0.9931285991850949,-0.9639719272779138,-0.9122344282513259,-0.8391169718222188,
  -0.7463062256567499,-0.6360536807265150,-0.5108670019508271,-0.3737060887154195,
  -0.2277858511416451,-0.0765265211334973,
   0.0765265211334973, 0.2277858511416451, 0.3737060887154195, 0.5108670019508271,
   0.6360536807265150, 0.7463062256567499, 0.8391169718222188, 0.9122344282513259,
   0.9639719272779138, 0.9931285991850949,
];
const GL20_WEIGHTS = [
  0.0176140071391521,0.0406014298003869,0.0626720483341091,0.0832767415767048,
  0.1019301198172404,0.1181945319615184,0.1316886384491766,0.1420961093183820,
  0.1491729864726037,0.1527533871307258,
  0.1527533871307258,0.1491729864726037,0.1420961093183820,0.1316886384491766,
  0.1181945319615184,0.1019301198172404,0.0832767415767048,0.0626720483341091,
  0.0406014298003869,0.0176140071391521,
];

function gaussLegendre20(f: (x: number) => number, a: number, b: number): number {
  const mid = (a + b) / 2;
  const half = (b - a) / 2;
  let sum = 0;
  for (let i = 0; i < 20; i++) sum += GL20_WEIGHTS[i] * f(mid + half * GL20_NODES[i]);
  return half * sum;
}

