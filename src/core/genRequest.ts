import { HttpRequest } from '../types/request';
import { isFunction, isPlainObject, isString, throwWarning, fetchHttp } from '../utils';

export function genRequest<P extends unknown[], R>(
  request: HttpRequest<P, R>,
): (() => Promise<R>) | ((...args: P) => Promise<R>) {
  return (...args: P) => {
    if (isFunction(request)) {
      return request(...args);
    }
    if (isString(request)) {
      return fetchHttp(request);
    }
    if (isPlainObject(request)) {
      const { url, ...res } = request;
      return fetchHttp(url, res);
    }
    throw throwWarning('unknown request type', true);
  };
}
