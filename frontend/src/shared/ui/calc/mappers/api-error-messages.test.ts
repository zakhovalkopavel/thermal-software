import { describe, expect, it } from 'vitest';
import { apiErrorMessages } from './api-error-messages';

describe('apiErrorMessages', () => {
  it('lists NestJS validation messages under status and error name', () => {
    const body = { statusCode: 400, message: ['T_K must be positive', 'p_Pa must be a number'], error: 'Bad Request' };

    expect(apiErrorMessages(body)).toEqual({
      title: '400 Bad Request',
      messages: ['T_K must be positive', 'p_Pa must be a number'],
    });
  });

  it('wraps a single NestJS message and omits a missing error name', () => {
    expect(apiErrorMessages({ statusCode: 422, message: 'Composition does not sum to 100 %' })).toEqual({
      title: '422',
      messages: ['Composition does not sum to 100 %'],
    });
  });

  it('uses a generic title and drops empty messages when the status is missing', () => {
    expect(apiErrorMessages({ message: '' })).toEqual({ title: 'Request failed', messages: [] });
  });

  it('treats an Error like a body without status, because it also has a message', () => {
    expect(apiErrorMessages(new Error('Network Error'))).toEqual({ title: 'Request failed', messages: ['Network Error'] });
  });

  it('falls back to the string form of anything else', () => {
    expect(apiErrorMessages(42)).toEqual({ title: 'Error', messages: ['42'] });
  });
});
