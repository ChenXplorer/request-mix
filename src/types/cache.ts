import { State, UnwrapRefs } from './request';

export interface CacheData<P extends unknown[], R> {
  parallelResults: {
    [key: string]: UnwrapRefs<State<P, R>>;
  };
  currentParallelKey: string;
}

export interface Cache<T> {
  data: T;
  timer: number;
}
