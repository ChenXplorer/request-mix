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
  SSR: boolean;
  formatData: (oldState: R) => any;
  delayLoadingTime: number;
  refreshDeps: WatchSource<any>[];
  pagination: Partial<Pagination>;
}>;
