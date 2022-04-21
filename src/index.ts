import { baseFetch } from './core/baseFetch';
import { feedFetch } from './core/feedFetch';
import { paginationFetch } from './core/paginationFetch';
import {
  BaseOptions,
  HttpRequest,
  BaseResults,
  PaginationOption,
  PaginationResult,
  FeedOption,
  FeedResult,
} from './types';
import { HTTP_CACHE_SSR } from './utils/cache';
import { SSR_DATA } from './utils/cons';
import serialize from './utils/serialize';

function requestMix<P extends unknown[], R>(request: HttpRequest<P, R>, option: BaseOptions<P, R>): BaseResults<P, R>;
function requestMix<P extends unknown[], R>(
  request: HttpRequest<P, R>,
  option: PaginationOption<P, R>,
): PaginationResult<P, R>;
function requestMix<P extends unknown[], R, LR extends unknown[]>(
  request: HttpRequest<P, R>,
  option: FeedOption<P, R>,
): FeedResult<P, R, LR>;

function requestMix<P extends unknown[], R, LR extends unknown[]>(request: HttpRequest<P, R>, option: any) {
  if (option?.feed) {
    return feedFetch<P, R, LR>(request, option);
  } else if (option?.pagination) {
    return paginationFetch<P, R>(request, option);
  } else {
    return baseFetch<P, R>(request, option);
  }
}

export function generateAsyncData() {
  return `<script>window.${SSR_DATA}=${serialize(HTTP_CACHE_SSR)}</script>`;
}

export { requestMix };
