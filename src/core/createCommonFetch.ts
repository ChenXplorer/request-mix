import { generateRequestKey, isSSR } from './../utils/index';
import { BaseOptions } from '../types/options';
import { HttpRequest, Mutate, Query, State, UnwrapRefs } from '../types/request';
import { Ref, ref, onServerPrefetch } from 'vue';
import { HttpRequestResult } from '../types/request';
import { genRequest, isFunction, setStateRelation } from '../utils';
import { CACHE, HTTP_CACHE_SSR } from '../utils/cache';
import { DEFAULT_PARALLEL_KEY, DEFAULT_CACHE_TIME, SSR_DATA } from '../utils/cons';

export const createCommonFetch = <P extends unknown[], R>(
  request: HttpRequest<P, R>,
  option: BaseOptions<P, R>,
  initialData?: Partial<UnwrapRefs<State<P, R>>>,
): HttpRequestResult<P, R> => {
  const loading = ref(initialData?.loading ?? false);
  const error = ref(initialData?.error ?? null);
  const data = <Ref<R>>ref(initialData?.data ?? null);
  const params = <Ref<P>>ref(initialData?.params ?? null);

  const query = genRequest<P, R>(request);

  const setState = setStateRelation<P, R>(
    {
      loading,
      error,
      data,
      params,
    },
    (state) => {
      const cacheKey = option?.cacheKey ?? '';
      const cacheTime = option?.cacheTime ?? DEFAULT_CACHE_TIME;
      const parallelKey = option?.parallelKey?.(...state.params.value) ?? DEFAULT_PARALLEL_KEY;
      CACHE.update(cacheKey, state, cacheTime, parallelKey);
    },
  );

  // loading 闪烁问题 处理
  // 1. 延迟loading = true ✅
  // 2. 延迟loading = false
  const loadingDelayTimer = ref();
  const handleLoadingDelay = () => {
    if (option.delayLoadingTime) {
      if (option.delayLoadingTime < 0) {
        loadingDelayTimer.value = setTimeout(setState, -option.delayLoadingTime, {
          loading: true,
        });
      } else {
        setTimeout(setState, option.delayLoadingTime, {
          loading: false,
        });
      }
    }
  };

  const handleSSRRequest = (...args: P) => {
    onServerPrefetch(async () => {
      await loadHandler(...args);
      if (option.asyncDataKey) {
        HTTP_CACHE_SSR.set(generateRequestKey(option.asyncDataKey, args), data.value);
      }
    });
  };

  const loadHandler = async (...args: P) => {
    setState({
      loading: true,
      params: args,
    });
    // handleLoadingDelay();
    try {
      const res = await query(...args);
      const result = option?.formatData ? option?.formatData(res) : res;
      setState({
        data: result,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error,
      });
    } finally {
      loadingDelayTimer.value && clearTimeout(loadingDelayTimer.value);
    }
  };

  const load = (...args: P) => {
    if (isSSR && option.SSR) {
      handleSSRRequest(...args);
      return Promise.resolve();
    }
    if (!isSSR && option.asyncDataKey) {
      const SSRCachedKey = generateRequestKey(option.asyncDataKey, args);
      const CSRMap = (window as any)[SSR_DATA];
      const cacheData = CSRMap?.get(SSRCachedKey);
      if (cacheData) {
        setState({
          params: args,
          data: cacheData,
        });
        CSRMap.delete(SSRCachedKey);
        return Promise.resolve();
      }
    }
    return loadHandler(...args);
  };

  const mutate: Mutate<R> = (value) => {
    const newData = isFunction(value) ? value(data.value) : value;
    setState({
      data: newData,
    });
  };

  const refresh = () => {
    load(...params.value);
  };

  return {
    loading,
    error,
    params,
    data,
    load,
    mutate,
    refresh,
  };
};
