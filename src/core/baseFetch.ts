import { BaseOptions } from '../types/options';
import { DEFAULT_PARALLEL_KEY } from '../utils/cons';
import { computed, reactive, Ref, ref, watch } from 'vue';
import { HttpRequest, ParallelResults, HttpRequestResult, UnwrapRefs, Mutate } from '../types/request';
import { createCommonFetch } from './createCommonFetch';
import { genRequest } from '../utils/index';
import { CACHE } from '../utils/cache';

export function baseFetch<P extends unknown[], R>(request: HttpRequest<P, R>, options?: BaseOptions<P, R>) {
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
  const parallelResults = <ParallelResults<P, R>>reactive({});
  const parallelLatestResult = computed(() => parallelResults[parallelLatestKey.value] ?? {});
  //set latest total state
  const loading = computed(() => parallelLatestResult.value.loading);
  const nothing = computed(() => parallelLatestResult.value.nothing);
  const error = computed(() => parallelLatestResult.value.error);
  const data = computed(() => parallelLatestResult.value.data);
  const params = computed(() => parallelLatestResult.value.params);

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
        reactive(createCommonFetch<P, R>(request, config))
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
        createCommonFetch<P, R>(request, config, {
          ...cacheParallelResult[cpr],
        }),
      );
    });
    parallelLatestKey.value = cacheCurrentParallelKey ?? parallelLatestKey.value;
  }

  // watch ready
  const unWatchReady = watch(ready, (isReady) => {
    if (isReady) {
      load(...readyParams.value);
      unWatchReady();
    }
  });

  // watch refreshDeps
  // 请求函数需要闭包的形式引用参数 无defaultParams
  refreshDeps?.length &&
    watch(refreshDeps, () => {
      !defaultParams?.length && parallelLatestResult.value.refresh();
    });

  return {
    load,
    loading,
    error,
    data,
    nothing,
    params,
    mutate,
    refresh,
    parallelResults,
  };
}
