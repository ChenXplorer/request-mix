import { Ref } from 'vue';

export type HttpFunc<P extends unknown[], R> = (...args: P) => Promise<R>;

export type HttpObject = Partial<RequestInit> & {
  url: string;
  [key: string]: any;
};

export type HttpRequest<P extends unknown[], R> = HttpFunc<P, R> | string | HttpObject;

export type State<P extends unknown[], R> = {
  loading: Ref<boolean>;
  nothing: Ref<boolean>;
  data: Ref<R | undefined | null>;
  error: Ref<Error | null>;
  params: Ref<P>;
};
export type UnRef<T> = T extends Ref<infer K> ? K : T;

export type UnwrapRefs<T> = {
  [key in keyof T]: UnRef<T[key]>;
};

export type Query<P extends unknown[], R> = (...args: P) => Promise<R>;
