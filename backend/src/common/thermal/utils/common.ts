import { EquationTypeDto } from '../dto/equation-type.dto';
import { LinearEquationMethod } from './linear-equation-method';
import { QuadraticEquationMethod } from './quadratic-equation-method';
import { CubicEquationMethod } from './cubic-equation-method';
import { QuarticEquationMethod } from './quartic-equation-method';
import { LinearHyperbolicEquationMethod } from './linear-hyperbolic-equation-method';
import { LinearHyperbolicLogarithmicEquationMethod } from './linear-hyperbolic-logarithmic-equation-method';
import { AlyLeeEquationMethod } from './aly-lee-equation-method';
import { DipprEquation102Method } from './dippr-equation-102-method';
import { Nasa7EquationMethod } from './nasa7-equation-method';

export class Common {
  static readonly kB = 1.380649e-23;
  static readonly R  = 8.31446261815324;
  static readonly Na = 6.02214076e23;
  /** Standard gravitational acceleration [m/s²] — ISO 80000-3 */
  static readonly g  = 9.80665;

  static logarithmicAverage(x1: number, x2: number): number {
    if (x1 < 0 || x2 < 0) throw new Error('Both args must be ≥ 0');
    if (x1 === x2) return x1;
    if (x1 === 0 || x2 === 0) return 0;
    return (x1 - x2) / Math.log(x1 / x2);
  }

  static average(data: number[]): number {
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  static validInterval(x: number, min: number, max: number): number {
    return x < min ? min : x > max ? max : x;
  }

  static isValidInterval(x: number, min: number, max: number): boolean {
    return x >= min && x <= max;
  }

  static equation(type: EquationTypeDto) {
    switch (type) {
      case EquationTypeDto.linear:                      return new LinearEquationMethod();
      case EquationTypeDto.quadratic:                   return new QuadraticEquationMethod();
      case EquationTypeDto.cubic:                       return new CubicEquationMethod();
      case EquationTypeDto.quartic:                     return new QuarticEquationMethod();
      case EquationTypeDto.linearHyperbolic:            return new LinearHyperbolicEquationMethod();
      case EquationTypeDto.linearHyperbolicLogarithmic: return new LinearHyperbolicLogarithmicEquationMethod();
      case EquationTypeDto.alyLee:                      return new AlyLeeEquationMethod();
      case EquationTypeDto.dipprN102:                   return new DipprEquation102Method();
      case EquationTypeDto.nasa7:                       return new Nasa7EquationMethod();
      default: throw new Error(`Unknown equation type: ${type}`);
    }
  }
}

