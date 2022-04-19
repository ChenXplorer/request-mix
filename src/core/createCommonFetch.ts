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
  const nothing = ref(initialData?.nothing ?? false);
  const error = ref(initialData?.error ?? null);
  const data = <Ref<R>>ref(initialData?.data ?? null);
  const params = <Ref<P>>ref(initialData?.params ?? null);

  const query = genRequest<P, R>(request);

  const setState = setStateRelation<P, R>(
    {
      loading,
      nothing,
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
  const currentLoadingTime = ref();
  const handleLoadingDelay = () => {
    if (option.delayLoadingTime) {
      if (option.delayLoadingTime < 0) {
        loadingDelayTimer.value = setTimeout(setState, -option.delayLoadingTime, {
          loading: true,
        });
      } else {
        currentLoadingTime.value = new Date().getTime();
      }
    }
  };

  const judgeNone = (res: any) => {
    let noResult = false;
    if (Array.isArray(res)) {
      noResult = res.length === 0;
    } else {
      noResult = !res;
    }
    return noResult;
  };

  const handleSSRRequest = (...args: P) => {
    onServerPrefetch(async () => {
      await loadHandler(...args);
      if (option.asyncDataKey) {
        HTTP_CACHE_SSR.set(generateRequestKey(option.asyncDataKey, args), data.value);
      }
    });
  };

  const syncSetTimeout = (cb: Function, time: number) =>
    new Promise((resolve) => {
      setTimeout(() => {
        cb();
        resolve(null);
      }, time);
    });

  const loadHandler = async (...args: P) => {
    setState({
      loading: (option.delayLoadingTime || 1) > 0, // 原本为true 负延时的话就是false
      params: args,
    });
    handleLoadingDelay();
    try {
      const res = await query(...args);
      const result = option?.formatData ? await option?.formatData(res) : res;
      const isNothing = judgeNone(result);
      let diff = -1;
      if (option.delayLoadingTime && option.delayLoadingTime > 0 && !isSSR) {
        diff = option.delayLoadingTime - (new Date().getTime() - currentLoadingTime.value);
      }
      if (diff > 0) {
        await syncSetTimeout(() => {
          setState({
            data: result,
            nothing: isNothing,
            loading: false,
            error: null,
          });
        }, diff);
      } else {
        setState({
          data: result,
          nothing: isNothing,
          loading: false,
          error: null,
        });
      }
      if (option?.onSuccess) {
        option.onSuccess(result, args);
      }
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error || true,
        nothing: false,
      });
      if (option?.onError) {
        option?.onError(error, args);
      }
    } finally {
      loadingDelayTimer.value && clearTimeout(loadingDelayTimer.value);
      option?.onAfter?.(args);
    }
  };

  const load = (...args: P) => {
    // onBefore hooks
    option?.onBefore?.(args);
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
    nothing,
    params,
    data,
    load,
    mutate,
    refresh,
  };
};
