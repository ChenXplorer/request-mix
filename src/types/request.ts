import { Ref } from '@vue/runtime-core';

export type HttpFunc<P extends unknown[], R> = (...args: P) => Promise<R>;

export type HttpObject = Partial<RequestInit> & {
  url: string;
  [key: string]: any;
};

export type HttpRequest<P extends unknown[], R> = HttpFunc<P, R> | string | HttpObject;

export type State<P extends unknown[], R> = {
  loading: Ref<boolean>;
  data: Ref<R | undefined | null>;
  error: Ref<Error | undefined | null>;
  params: Ref<P>;
};
export type UnRef<T> = T extends Ref<infer K> ? K : T;

export type UnwrapRefs<T> = {
  [key in keyof T]: UnRef<T[key]>;
};

export type Query<P extends unknown[], R> = (...args: P) => Promise<R>;

export type Mutate<R> = (data: R | ((oldData: R) => R)) => void;
export interface HttpRequestResult<P extends unknown[], R> extends State<P, R> {
  load: (...args: P) => Promise<any | null>;
  refresh: () => void;
  mutate: Mutate<R>;
}

export interface ParallelResults<P extends unknown[], R> {
  [key: string]: UnwrapRefs<HttpRequestResult<P, R>>;
}
