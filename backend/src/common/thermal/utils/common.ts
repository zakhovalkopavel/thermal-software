import { EquationTypeDto } from '../dto/equation-type.dto';
import { LinearEquationMethod } from './equation-methods/linear-equation-method';
import { QuadraticEquationMethod } from './equation-methods/quadratic-equation-method';
import { CubicEquationMethod } from './equation-methods/cubic-equation-method';
import { QuarticEquationMethod } from './equation-methods/quartic-equation-method';
import { LinearHyperbolicEquationMethod } from './equation-methods/linear-hyperbolic-equation-method';
import { LinearHyperbolicLogarithmicEquationMethod } from './equation-methods/linear-hyperbolic-logarithmic-equation-method';
import { AlyLeeEquationMethod } from './equation-methods/aly-lee-equation-method';
import { DipprEquation102Method } from './equation-methods/dippr-equation-102-method';
import { Nasa7EquationMethod } from './equation-methods/nasa7-equation-method';
import { Nasa9EquationMethod } from './equation-methods/nasa9-equation-method';
import { DipprEquation114Method } from './equation-methods/dippr-equation-114-method';
import { TrcCpEquationMethod } from './equation-methods/trc-cp-equation-method';
import { ShomateEquationMethod } from './equation-methods/shomate-equation-method';
import { ZabranskySplineEquationMethod } from './equation-methods/zabransky-spline-equation-method';
import { ZabranskyQuasiPolynomialEquationMethod } from './equation-methods/zabransky-quasi-polynomial-equation-method';
import { DipprEquation101Method } from './equation-methods/dippr-equation-101-method';
import { Ppds9EquationMethod } from './equation-methods/ppds9-equation-method';
import { Ppds10EquationMethod } from './equation-methods/ppds10-equation-method';
import { Ppds12EquationMethod } from './equation-methods/ppds12-equation-method';
import { DipprEquation106Method } from './equation-methods/dippr-equation-106-method';
import { Wagner25EquationMethod } from './equation-methods/wagner25-equation-method';
import { SutherlandEquationMethod } from './equation-methods/sutherland-equation-method';
import { PowerLawEquationMethod } from './equation-methods/power-law-equation-method';

export class Common {
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
      case EquationTypeDto.nasa9:                       return new Nasa9EquationMethod();
      case EquationTypeDto.dipprN114:                   return new DipprEquation114Method();
      case EquationTypeDto.trcCp:                       return new TrcCpEquationMethod();
      case EquationTypeDto.shomate:                     return new ShomateEquationMethod();
      case EquationTypeDto.zabranskySpline:             return new ZabranskySplineEquationMethod();
      case EquationTypeDto.zabranskyQuasiPolynomial:    return new ZabranskyQuasiPolynomialEquationMethod();
      case EquationTypeDto.dipprN101:                   return new DipprEquation101Method();
      case EquationTypeDto.ppds9:                       return new Ppds9EquationMethod();
      case EquationTypeDto.ppds10:                      return new Ppds10EquationMethod();
      case EquationTypeDto.ppds12:                      return new Ppds12EquationMethod();
      case EquationTypeDto.dipprN106:                   return new DipprEquation106Method();
      case EquationTypeDto.wagner25:                    return new Wagner25EquationMethod();
      case EquationTypeDto.sutherland:                  return new SutherlandEquationMethod();
      case EquationTypeDto.powerLaw:                    return new PowerLawEquationMethod();
      default: throw new Error(`Unknown equation type: ${type}`);
    }
  }
}

