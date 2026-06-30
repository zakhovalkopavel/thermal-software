import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { brentq } from '../../../common/utils/root-finding.util';
import { brent, nelderMead } from '../../../common/utils/optimization.util';
import {
  linearRegression,
  polynomialFit,
  exponentialFit,
  powerFit,
  levenbergMarquardt,
} from '../../../common/utils/regression.util';
import {
  polyCoefficientsToObject,
  polyFormula,
  linearFormula,
  exponentialFormula,
  powerFormula,
  lmFormula,
} from '../../../common/utils/numeric-format.util';
import {
  BrentqInputDto,
  XYInputDto,
  PolynomialFitInputDto,
  LevenbergMarquardtInputDto,
  NelderMeadInputDto,
} from '../dto';

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('numeric')
@Controller('numeric')
export class NumericController {

  // ── Root finding ─────────────────────────────────────────────────────

  @Post('brentq')
  @ApiOperation({
    summary: 'Find root of f(x) in [a,b] — Brent\'s method',
    description: 'Equivalent to scipy.optimize.brentq. Provide a JS expression string for f(x). Returns the root x* such that f(x*) ≈ 0.',
  })
  @ApiBody({
    type: BrentqInputDto,
    examples: {
      cosRoot: {
        summary: 'Root of cos(x) = x in [0, 2]',
        value: { a: 0, b: 2, expression: 'Math.cos(x) - x' },
      },
      cubic: {
        summary: 'Root of x³ - x - 2 in [1, 2]',
        value: { a: 1, b: 2, expression: 'x**3 - x - 2' },
      },
    },
  })
  findRootBrentq(@Body() dto: BrentqInputDto) {
    // eslint-disable-next-line no-new-func
    const f = new Function('x', `return ${dto.expression};`) as (x: number) => number;
    return brentq(f, dto.a, dto.b, dto.tol ?? 1e-10);
  }

  @Post('brent')
  @ApiOperation({
    summary: 'Minimise f(x) in [a,b] — golden-section search',
    description: 'Equivalent to scipy.optimize.brent. Provide a JS expression string for f(x). Returns the minimum x*.',
  })
  @ApiBody({
    type: BrentqInputDto,
    examples: {
      parabola: {
        summary: 'Minimum of (x-1.5)² in [0, 3]',
        value: { a: 0, b: 3, expression: '(x - 1.5)**2' },
      },
    },
  })
  minimise1d(@Body() dto: BrentqInputDto) {
    // eslint-disable-next-line no-new-func
    const f = new Function('x', `return ${dto.expression};`) as (x: number) => number;
    return brent(f, dto.a, dto.b, dto.tol ?? 1e-8);
  }

  // ── Multi-variable optimisation ──────────────────────────────────────

  @Post('nelder-mead')
  @ApiOperation({
    summary: 'Nelder-Mead minimisation — N-variable gradient-free',
    description:
      'Equivalent to scipy.optimize.minimize(method="Nelder-Mead"). ' +
      'Provide the expression using named variables matching the keys of `variables` ' +
      '(e.g. x1, x2). Returns { variables: { x1: …, x2: … }, fval }.',
  })
  @ApiBody({
    type: NelderMeadInputDto,
    examples: {
      bowl2d: {
        summary: '2D bowl — minimum at x1=2, x2=3',
        value: {
          expression: '(x1-2)**2 + (x2-3)**2',
          variables: { x1: 0, x2: 0 },
        },
      },
      rosenbrock: {
        summary: 'Rosenbrock banana function — minimum at x1=1, x2=1',
        value: {
          expression: '(1-x1)**2 + 100*(x2-x1**2)**2',
          variables: { x1: 0, x2: 0 },
        },
      },
      bowl3d: {
        summary: '3D bowl — minimum at x1=1, x2=2, x3=3',
        value: {
          expression: '(x1-1)**2 + (x2-2)**2 + (x3-3)**2',
          variables: { x1: 0, x2: 0, x3: 0 },
        },
      },
    },
  })
  nelderMead(@Body() dto: NelderMeadInputDto) {
    // Sort keys to get a stable, reproducible variable-to-index mapping
    const keys = Object.keys(dto.variables).sort();
    const x0 = keys.map(k => dto.variables[k]);
    // Build a function with named parameters that matches the keys
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `return ${dto.expression};`) as (...args: number[]) => number;
    const wrapper = (x: number[]) => fn(...x);

    const result = nelderMead(wrapper, x0, { maxIterations: dto.maxIterations });

    // Map result array back to named variables object
    const variables = Object.fromEntries(keys.map((k, i) => [k, result.x[i]]));
    return { variables, fval: result.fx };
  }

  // ── Regression / curve fitting ───────────────────────────────────────

  @Post('regression/linear')
  @ApiOperation({
    summary: 'Linear regression y = slope·x + intercept — OLS',
    description: 'Returns slope, intercept, r², and the complete formula string.',
  })
  @ApiBody({
    type: XYInputDto,
    examples: {
      basic: {
        summary: 'Noisy linear data',
        value: { x: [1, 2, 3, 4, 5], y: [2.1, 4.0, 6.1, 7.9, 10.2] },
      },
    },
  })
  linearRegression(@Body() dto: XYInputDto) {
    const { slope, intercept, r2 } = linearRegression(dto.x, dto.y);
    return { slope, intercept, r2, formula: linearFormula(slope, intercept) };
  }

  @Post('regression/polynomial')
  @ApiOperation({
    summary: 'Polynomial fit y = c0 + c1·x + … + cn·xⁿ',
    description:
      'Returns named coefficients object { c0, c1, …, cn }, r², and the complete formula string. ' +
      'Coefficients are in ascending degree order (c0 = constant term).',
  })
  @ApiBody({
    type: PolynomialFitInputDto,
    examples: {
      quadratic: {
        summary: 'Quadratic fit to parabolic data',
        value: { x: [0, 1, 2, 3, 4], y: [1.0, 1.9, 4.1, 9.0, 16.2], degree: 2 },
      },
      cubic: {
        summary: 'Cubic fit',
        value: { x: [0, 1, 2, 3, 4, 5], y: [0, 1.1, 7.9, 27.2, 64.1, 125.0], degree: 3 },
      },
    },
  })
  polynomialFit(@Body() dto: PolynomialFitInputDto) {
    const { coefficients: raw, r2 } = polynomialFit(dto.x, dto.y, dto.degree);
    return {
      coefficients: polyCoefficientsToObject(raw),
      r2,
      formula: polyFormula(raw),
    };
  }

  @Post('regression/exponential')
  @ApiOperation({
    summary: 'Exponential fit y = A·eᴮˣ (all y must be positive)',
    description: 'Returns A, B, r², and the complete formula string.',
  })
  @ApiBody({
    type: XYInputDto,
    examples: {
      growth: {
        summary: 'Exponential growth data',
        value: { x: [0, 1, 2, 3, 4], y: [1.0, 2.72, 7.39, 20.1, 54.6] },
      },
    },
  })
  exponentialFit(@Body() dto: XYInputDto) {
    const { A, B, r2 } = exponentialFit(dto.x, dto.y);
    return { A, B, r2, formula: exponentialFormula(A, B) };
  }

  @Post('regression/power')
  @ApiOperation({
    summary: 'Power fit y = A·xᴮ (all x, y must be positive)',
    description: 'Returns A, B, r², and the complete formula string.',
  })
  @ApiBody({
    type: XYInputDto,
    examples: {
      powerLaw: {
        summary: 'Power-law data (y ~ x²)',
        value: { x: [1, 2, 3, 4, 5], y: [1.0, 4.1, 9.0, 16.2, 25.1] },
      },
    },
  })
  powerFit(@Body() dto: XYInputDto) {
    const { A, B, r2 } = powerFit(dto.x, dto.y);
    return { A, B, r2, formula: powerFormula(A, B) };
  }

  @Post('regression/levenberg-marquardt')
  @ApiOperation({
    summary: 'Nonlinear least-squares via Levenberg-Marquardt',
    description:
      'Equivalent to scipy.optimize.curve_fit. Provide model as a curried JS arrow-function string. ' +
      'Returns fitted parameter values, per-parameter errors, iteration count, and formula string ' +
      'with substituted values.',
  })
  @ApiBody({
    type: LevenbergMarquardtInputDto,
    examples: {
      exponentialGrowth: {
        summary: 'Fit A·exp(B·x) to exponential growth data',
        value: {
          x: [0, 1, 2, 3, 4],
          y: [1.0, 2.72, 7.39, 20.1, 54.6],
          modelExpression: '([A,B]) => x => A * Math.exp(B * x)',
          initialValues: [1, 1],
        },
      },
      sineWave: {
        summary: 'Fit A·sin(B·x + C) to oscillation data',
        value: {
          x: [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0],
          y: [0, 0.88, 0.91, 0.30, -0.42, -0.98, -0.84],
          modelExpression: '([A,B,C]) => x => A * Math.sin(B * x + C)',
          initialValues: [1, 2, 0],
        },
      },
      arrhenius: {
        summary: 'Fit Arrhenius A·exp(B/T) to rate-constant data',
        value: {
          x: [500, 600, 700, 800, 1000],
          y: [0.012, 0.18, 1.4, 7.2, 89.0],
          modelExpression: '([A,B]) => T => A * Math.exp(B / T)',
          initialValues: [1e6, -10000],
        },
      },
    },
  })
  levenbergMarquardt(@Body() dto: LevenbergMarquardtInputDto) {
    // eslint-disable-next-line no-new-func
    const model = new Function('params', `return (${dto.modelExpression})(params);`) as
      (params: number[]) => (x: number) => number;
    const { parameterValues, parameterError, iterations } = levenbergMarquardt(
      dto.x, dto.y, model, dto.initialValues,
      { maxIterations: dto.maxIterations },
    );
    return {
      parameterValues,
      parameterError,
      iterations,
      formula: lmFormula(dto.modelExpression, parameterValues),
    };
  }
}

