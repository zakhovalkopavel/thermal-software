import { describe, expect, it } from 'vitest';
import { isOutsideDomainError } from './is-outside-domain-error.mapper';

describe('metals › is-outside-domain-error', () => {
  it('detects Nest BadRequest bodies from cubicSpline', () => {
    expect(
      isOutsideDomainError({
        statusCode: 400,
        message: 'cubicSpline: x=300 outside domain [373.15, 873.15]',
        error: 'Bad Request',
      }),
    ).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isOutsideDomainError({ statusCode: 404, message: 'Unknown metal material: x' })).toBe(false);
    expect(isOutsideDomainError(new Error('Network Error'))).toBe(false);
  });
});
