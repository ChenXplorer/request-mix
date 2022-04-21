import { Ref, WatchSource, ComputedRef } from 'vue';

export type Pagination = {
  pnKey: string;
  psKey: string;
  totalKey: string;
  totalPageKey: string;
};

export type BaseOptions<P extends unknown[], R> = Partial<{
  defaultParams: P;
  manual: boolean;
  parallelKey: (...arg: P) => string;
  ready: Ref<Boolean>;
  cacheKey: string;
  cacheTime: number;
  SSR: boolean;
  asyncDataKey: string;
  formatData: (oldState: any) => R;
  onSuccess: (data: R, params: P) => void;
  onError: (error: Error, params: P) => void;
  onBefore: (params: P) => void;
  onAfter: (params: P) => void;
  delayLoadingTime: number;
  refreshDeps: WatchSource<any>[];
}>;

export type Feed = {
  dataKey: string | Ref<string> | ComputedRef<string>;
  totalKey: string | Ref<string> | ComputedRef<string>;
  total: Ref<number>;
  loadingOffset: number;
  noMore: Ref<boolean>;
  increaseKey: string;
  increaseStep: number;
  scrollThrottle: number;
  scrollCheckFull: Boolean;
  containerRef: Ref<any>;
};

export interface PaginationOption<P extends unknown[], R> extends Omit<BaseOptions<P, R>, 'parallelKey'> {
  pagination: Pagination;
}

export interface FeedOption<P extends unknown[], R> extends Omit<BaseOptions<P, R>, 'parallelKey'> {
  feed: Partial<Feed>;
}
