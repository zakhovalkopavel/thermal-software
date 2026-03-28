import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  brentq,
  brent,
  nelderMead,
  linearRegression,
  polynomialFit,
  exponentialFit,
  powerFit,
  levenbergMarquardt,
} from '../../../common/utils/numeric.util';

// ── Input DTOs (inline — one class per concern) ───────────────────────────────

class BrentqInputDto {
  /** Bracket left bound */
  a: number;
  /** Bracket right bound */
  b: number;
  /** Absolute tolerance (default 1e-10) */
  tol?: number;
  /** JavaScript expression for f(x) — must be a valid JS arrow function body, e.g. "Math.cos(x) - x" */
  expression: string;
}

class XYInputDto {
  x: number[];
  y: number[];
}

class PolynomialFitInputDto extends XYInputDto {
  /** Polynomial degree */
  degree: number;
}

class LevenbergMarquardtInputDto {
  x: number[];
  y: number[];
  /**
   * Model as a JS arrow function string returning a function.
   * Example: "([A,B]) => x => A * Math.exp(B * x)"
   */
  modelExpression: string;
  initialValues: number[];
  maxIterations?: number;
}

class NelderMeadInputDto {
  /** JS arrow function body: "(x) => (x[0]-2)**2 + (x[1]-3)**2" */
  expression: string;
  /** Initial guess vector */
  x0: number[];
  maxIterations?: number;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('numeric')
@Controller('numeric')
export class NumericController {

  // ── Root finding ─────────────────────────────────────────────────────

  @Post('brentq')
  @ApiOperation({
    summary: 'Find root of f(x) in [a,b] — Brent\'s method',
    description: 'Equivalent to scipy.optimize.brentq. Provide a JS expression string for f(x).',
  })
  findRootBrentq(@Body() dto: BrentqInputDto) {
    // eslint-disable-next-line no-new-func
    const f = new Function('x', `return ${dto.expression};`) as (x: number) => number;
    return brentq(f, dto.a, dto.b, dto.tol ?? 1e-10);
  }

  @Post('brent')
  @ApiOperation({
    summary: 'Minimise f(x) in [a,b] — golden-section search',
    description: 'Equivalent to scipy.optimize.brent. Provide a JS expression string for f(x).',
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
    description: 'Equivalent to scipy.optimize.minimize(method="Nelder-Mead").',
  })
  nelderMead(@Body() dto: NelderMeadInputDto) {
    // eslint-disable-next-line no-new-func
    const f = new Function('x', `return (${dto.expression})(x);`) as (x: number[]) => number;
    return nelderMead(f, dto.x0, { maxIterations: dto.maxIterations });
  }

  // ── Regression / curve fitting ───────────────────────────────────────

  @Post('regression/linear')
  @ApiOperation({ summary: 'Linear regression y = slope·x + intercept — OLS' })
  linearRegression(@Body() dto: XYInputDto) {
    return linearRegression(dto.x, dto.y);
  }

  @Post('regression/polynomial')
  @ApiOperation({ summary: 'Polynomial fit y = c0 + c1·x + … + cn·xⁿ' })
  polynomialFit(@Body() dto: PolynomialFitInputDto) {
    return polynomialFit(dto.x, dto.y, dto.degree);
  }

  @Post('regression/exponential')
  @ApiOperation({ summary: 'Exponential fit y = A·eᴮˣ (all y must be positive)' })
  exponentialFit(@Body() dto: XYInputDto) {
    return exponentialFit(dto.x, dto.y);
  }

  @Post('regression/power')
  @ApiOperation({ summary: 'Power fit y = A·xᴮ (all x, y must be positive)' })
  powerFit(@Body() dto: XYInputDto) {
    return powerFit(dto.x, dto.y);
  }

  @Post('regression/levenberg-marquardt')
  @ApiOperation({
    summary: 'Nonlinear least-squares via Levenberg-Marquardt',
    description: 'Equivalent to scipy.optimize.curve_fit. Provide model as JS expression.',
  })
  levenbergMarquardt(@Body() dto: LevenbergMarquardtInputDto) {
    // eslint-disable-next-line no-new-func
    const model = new Function('params', `return (${dto.modelExpression})(params);`) as
      (params: number[]) => (x: number) => number;
    return levenbergMarquardt(dto.x, dto.y, model, dto.initialValues, {
      maxIterations: dto.maxIterations,
    });
  }
}

