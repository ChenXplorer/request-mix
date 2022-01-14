import { BaseOptions } from 'src/types/options';
import { computed, reactive, Ref, ref, watch } from 'vue';
import { HttpRequest, ParallelResults, HttpRequestResult, UnwrapRefs, Mutate } from '../types/request';
import { createHttpRequest } from './createHttpRequest';
import { genRequest } from './genRequest';

const DEFAULT_PARALLEL_KEY = 'DEFAULT_PARALLEL_KEY';

export function useHttp<P extends unknown[], R>(request: HttpRequest<P, R>, options?: BaseOptions<P, R>) {
  const query = genRequest(request);

  //set latest total state
  const loading = ref(false);
  const error = ref();
  const data = <Ref<R | undefined | null>>ref();

  const config = options ?? {};
  const { defaultParams = ([] as unknown) as P, manual = false, parallelKey } = config;

  const parallelLatestKey = ref(DEFAULT_PARALLEL_KEY);
  const parallelResults = <ParallelResults<P, R>>reactive({
    DEFAULT_PARALLEL_KEY: reactive(createHttpRequest<P, R>(query)),
  });
  const parallelLatestResult = computed(() => parallelResults[parallelLatestKey.value] ?? {});

  watch(
    parallelLatestResult,
    (res) => {
      loading.value = res.loading;
      error.value = res.error;
      data.value = res.data;
    },
    { immediate: true, deep: true },
  );

  const load = (...args: P) => {
    const currentKey = parallelKey?.(...args) ?? DEFAULT_PARALLEL_KEY;
    if (!parallelResults[currentKey]) {
      parallelResults[currentKey] = <UnwrapRefs<HttpRequestResult<P, R>>>reactive(createHttpRequest<P, R>(query));
    }
    parallelLatestKey.value = currentKey;
    return parallelLatestResult.value.load(...args);
  };

  const mutate: Mutate<R> = (value) => parallelLatestResult.value.mutate(value);

  if (!manual) {
    load(...defaultParams);
  }

  return {
    load,
    loading,
    error,
    data,
    mutate,
    parallelResults,
  };
}
