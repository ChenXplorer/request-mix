import { Ref, WatchSource, ComputedRef } from 'vue';

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
  asyncDataKey: string;
  formatData: (oldState: R) => any;
  onSuccess?: (data: R, params: P) => void;
  onError?: (error: Error, params: P) => void;
  onBefore?: (params: P) => void;
  onAfter?: (params: P) => void;
  delayLoadingTime: number;
  refreshDeps: WatchSource<any>[];
  pagination: Partial<Pagination>;
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
