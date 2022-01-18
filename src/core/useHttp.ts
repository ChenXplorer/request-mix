import { BaseOptions } from '../types/options';
import { DEFAULT_PARALLEL_KEY } from '../utils/cons';
import { computed, reactive, Ref, ref, watch } from 'vue';
import { HttpRequest, ParallelResults, HttpRequestResult, UnwrapRefs, Mutate } from '../types/request';
import { createHttpRequest } from './createHttpRequest';
import { genRequest } from './genRequest';
import { CACHE } from '../utils/cache';

export function useHttp<P extends unknown[], R>(request: HttpRequest<P, R>, options?: BaseOptions<P, R>) {
  const query = genRequest<P, R>(request);

  const config = options ?? {};
  const {
    defaultParams = ([] as unknown) as P,
    manual = false,
    parallelKey,
    ready = ref(true),
    cacheKey,
    refreshDeps,
  } = config;

  const parallelLatestKey = ref(DEFAULT_PARALLEL_KEY);
  const parallelResults = <ParallelResults<P, R>>reactive({
    DEFAULT_PARALLEL_KEY: reactive(createHttpRequest<P, R>(query, config)),
  });
  const parallelLatestResult = computed(() => parallelResults[parallelLatestKey.value] ?? {});
  //set latest total state
  const loading = computed(() => parallelLatestResult.value.loading);
  const error = computed(() => parallelLatestResult.value.error);
  const data = computed(() => parallelLatestResult.value.data);

  const readyParams = <Ref<P>>ref();
  const triggerReady = computed(() => ready.value);
  const load = (...args: P) => {
    if (!triggerReady.value) {
      readyParams.value = args;
      return Promise.resolve(null);
    }
    const currentKey = parallelKey?.(...args) ?? DEFAULT_PARALLEL_KEY;
    if (!parallelResults[currentKey]) {
      parallelResults[currentKey] = <UnwrapRefs<HttpRequestResult<P, R>>>(
        reactive(createHttpRequest<P, R>(query, config))
      );
    }
    parallelLatestKey.value = currentKey;
    return parallelLatestResult.value.load(...args);
  };
  const mutate: Mutate<R> = (value) => parallelLatestResult.value.mutate(value);
  const refresh = () => parallelLatestResult.value.refresh();

  if (!manual) {
    load(...defaultParams);
  }

  if (cacheKey) {
    const cacheData = CACHE.get<P, R>(cacheKey)?.data;
    const cacheParallelResult = cacheData?.parallelResults ?? {};
    const cacheCurrentParallelKey = cacheData?.currentParallelKey;
    Object.keys(cacheParallelResult).forEach((cpr) => {
      parallelResults[cpr] = <UnwrapRefs<HttpRequestResult<P, R>>>reactive(
        createHttpRequest<P, R>(query, config, {
          ...cacheParallelResult[cpr],
        }),
      );
    });
    parallelLatestKey.value = cacheCurrentParallelKey ?? parallelLatestKey.value;
  }

  // watch ready
  const unWatch = watch(ready, (isReady) => {
    if (isReady) {
      load(...readyParams.value);
      unWatch();
    }
  });

  // watch refreshDeps
  // 请求函数需要闭包的形式引用参数
  refreshDeps?.length &&
    watch(refreshDeps, () => {
      !defaultParams?.length && parallelLatestResult.value.refresh();
    });

  return {
    load,
    loading,
    error,
    data,
    mutate,
    refresh,
    parallelResults,
  };
}
