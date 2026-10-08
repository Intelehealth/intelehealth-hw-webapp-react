import { describe, expect, it } from 'vitest';
import { describeError } from '../../utils/safe-error';

describe('describeError', () => {
  it('returns the error type and the HTTP status of a response error', () => {
    const err = Object.assign(new Error('boom'), { response: { status: 503 } });
    expect(describeError(err)).toEqual({ name: 'Error', status: 503 });
  });

  it('returns only the type when there is no response', () => {
    expect(describeError(new TypeError('x'))).toEqual({ name: 'TypeError', status: undefined });
  });

  it('never includes the message, response body, url or headers', () => {
    const err = Object.assign(new Error('token=secret-123 patient=John'), {
      response: { status: 401, data: { token: 'secret-123' }, headers: { authorization: 'secret-123' } },
      config: { url: '/visit/abc?patient=John' },
    });
    expect(JSON.stringify(describeError(err))).not.toContain('secret-123');
    expect(JSON.stringify(describeError(err))).not.toContain('John');
  });

  it('ignores a status or name that is not the expected type', () => {
    expect(describeError({ name: 42, response: { status: '500' } })).toEqual({
      name: undefined,
      status: undefined,
    });
  });

  it.each([null, undefined, 'a string', 7])('copes with a non-object error (%s)', value => {
    expect(describeError(value)).toEqual({ name: undefined, status: undefined });
  });
});
