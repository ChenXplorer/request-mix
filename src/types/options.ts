import { Ref, WatchSource } from 'vue';

export interface Pagination {
  pnKey: string;
  psKey: string;
  totalKey: string;
  totalPageKey: string;
}

export type BaseOptions<P extends unknown[], R> = Partial<{
  defaultParams: P;
  manual: boolean;
  parallelKey: (...arg: P) => string;
  ready: Ref<Boolean>;
  cacheKey: string;
  cacheTime: number;
  delayLoadingTime: number;
  refreshDeps: WatchSource<any>[];
  formatResult: (oldState: R) => any;
  pagination: Partial<Pagination>;
}>;
