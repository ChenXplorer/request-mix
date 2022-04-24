import { ComputedRef, Ref, WritableComputedRef } from 'vue';
import { State, UnwrapRefs } from '.';
export type Mutate<R> = (data: R | ((oldData: R) => R)) => void;

export interface CommonResult<P extends unknown[], R> extends State<P, R> {
  load: (...args: P) => Promise<any | null>;
  refresh: () => void;
  mutate: Mutate<R>;
}

export interface ParallelResults<P extends unknown[], R> {
  [key: string]: UnwrapRefs<CommonResult<P, R>>;
}

export interface BaseResults<P extends unknown[], R> extends CommonResult<P, R> {
  loading: ComputedRef<boolean>;
  error: ComputedRef<Error | null>;
  data: ComputedRef<R | null | undefined>;
  nothing: ComputedRef<boolean>;
  params: ComputedRef<P>;
  parallelResults: ParallelResults<P, R>;
}

export interface FeedResult<P extends unknown[], R, LR>
  extends Omit<BaseResults<P, R>, 'parallelResults' | 'load' | 'nothing'> {
  list: Ref<LR[]>;
  total: Ref<number>;
  noMore: ComputedRef<boolean>;
  nothing: Ref<boolean>;
  unobserveEvents: () => void;
  loadMore: () => void;
}

export interface PaginationResult<P extends unknown[], R> extends BaseResults<P, R> {
  pn: WritableComputedRef<number>;
  ps: WritableComputedRef<number>;
  total: ComputedRef<any>;
  totalPage: ComputedRef<any>;
  change: (value: { pn?: number | undefined; ps?: number | undefined }) => void;
}
