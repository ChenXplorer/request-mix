import { baseFetch } from './core/baseFetch';
import { feedFetch } from './core/feedFetch';
import { paginationFetch } from './core/paginationFetch';
import { HttpRequest } from './types/request';

export function requestMix<P extends unknown[], R>(request: HttpRequest<P, R>, option: any) {
  if (option?.feed) {
    return feedFetch(request, option);
  } else if (option?.pagination) {
    return paginationFetch(request, option);
  } else {
    return baseFetch(request, option);
  }
}
