import { getByPath, isInClient, merge } from '../utils';
import { computed, onMounted, onUnmounted, nextTick, ref, Ref, watch, watchEffect } from 'vue';
import { BaseOptions, Feed } from '../types/options';
import { HttpRequest } from '../types/request';
import { baseFetch } from './baseFetch';
import { onScroll } from '../utils/infinite-scroll';

export type FeedOption<P extends unknown[], R> = Omit<BaseOptions<P, R>, 'parallelKey'> & { feed: Partial<Feed> };

export function feedFetch<P extends unknown[], R>(request: HttpRequest<P, R>, option: FeedOption<P, R>) {
  const { feed, ...feedOptionTemp } = option;

  const defaultFeed = {
    dataKey: '',
    totalKey: 'total',
    increaseKey: 'pn',
    scrollCheckFull: true,
    loadingOffset: 100,
    increaseStep: 1,
    ...feed,
  };
  const defaultFeedParams = {
    [defaultFeed.increaseKey]: 1,
  };

  const feedOption: FeedOption<P, R> = merge(
    {
      defaultParams: [
        {
          ...defaultFeedParams,
        },
      ] as P,
    },
    feedOptionTemp,
  );

  const { data: dataTemp, parallelResults, load, params, loading, ...rest } = baseFetch(request, {
    ...feedOption,
    parallelKey: (...args: P) => (args?.[0] as Object)?.[defaultFeed.increaseKey] + '',
  });

  // get total data list
  // tips: Object.keys Object.values ans so on will sort auto by key
  const list = computed(() => {
    const res = Object.values(parallelResults).reduce((pre, cur) => {
      const dadaKey = typeof defaultFeed.dataKey === 'string' ? defaultFeed.dataKey : defaultFeed.dataKey.value;
      const val = getByPath(cur.data!, dadaKey);
      return val && Array.isArray(val) ? pre.concat(val) : pre;
    }, [] as R[]);
    return res;
  });

  const nothing = computed(() => {
    const values = Object.values(parallelResults);
    if (values?.length) {
      const dadaKey = typeof defaultFeed.dataKey === 'string' ? defaultFeed.dataKey : defaultFeed.dataKey.value;
      const val = getByPath(values[0].data!, dadaKey);
      const result = Object.keys(val || []);
      return result.length === 0;
    }
    return false;
  });

  const total = ref(option.feed?.total?.value ?? Number.MAX_SAFE_INTEGER);

  watch(dataTemp, (val) => {
    const key = typeof defaultFeed.totalKey === 'string' ? defaultFeed.totalKey : defaultFeed.totalKey.value;
    val && (total.value = option.feed?.total?.value ?? getByPath(val, key, 0));
  });

  const noMore = computed(() => option.feed?.noMore?.value ?? list.value.length >= total.value);

  const loadMore = () => {
    if (noMore.value) return;
    const pre = ((params.value?.[0] as Object)?.[defaultFeed.increaseKey] || 0) as number;
    const cur = pre + defaultFeed.increaseStep;
    const curParams = merge(params.value, [
      {
        [defaultFeed.increaseKey]: cur,
      },
    ]);
    load(...curParams);
  };

  const refresh = () => {
    Object.keys(parallelResults).forEach((key) => {
      delete parallelResults[key];
    });
    const params = feedOption?.defaultParams as P;
    unobserveEvents();
    load(...params);
    observerEvents();
  };

  // observer dom to load more auto
  let destroyObserver: Function;

  const observerEvents = () => {
    const containerEl = option?.feed?.containerRef?.value?.$el || option?.feed?.containerRef?.value;
    if (containerEl) {
      destroyObserver = onScroll(defaultFeed, loadMore, loading)!;
    }
  };
  const unobserveEvents = () => {
    destroyObserver?.();
  };

  onMounted(() => {
    observerEvents();
  });

  onUnmounted(() => {
    unobserveEvents();
  });

  return {
    ...rest,
    list,
    loading,
    data: dataTemp,
    total,
    noMore,
    nothing,
    params,
    loadMore,
    refresh,
    unobserveEvents,
  };
}
