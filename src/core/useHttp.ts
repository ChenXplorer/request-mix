import { BaseOptions } from 'src/types/options';
import { HttpRequest } from '../types/request';
import { createHttpRequest } from './createHttpRequest';
import { genRequest } from './genRequest';

export function useHttp<P extends unknown[], R>(request: HttpRequest<P, R>, options?: BaseOptions<P, R>) {
  const query = genRequest(request);
  const { load, loading, error, data, mutate } = createHttpRequest<P, R>(query);
  const config = options ?? {};
  const { defaultParams = ([] as unknown) as P, manual = false } = config;

  if (!manual) {
    load(...defaultParams);
  }
  return {
    load,
    loading,
    error,
    data,
    mutate,
  };
}
