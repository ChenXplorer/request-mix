import { getByPath, merge, isSSR } from '../utils';
import { computed, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { FeedOption, FeedResult, HttpRequest } from '../types';
import { baseFetch } from './baseFetch';
import { onScroll } from '../utils/infinite-scroll';

export function feedFetch<P extends unknown[], R, LR extends unknown[]>(
  request: HttpRequest<P, R>,
  option: FeedOption<P, R>,
): FeedResult<P, R, LR> {
  const { feed, ...feedOptionTemp } = option;
  const nothing = ref(false);
  const list = ref([]) as Ref<LR[]>;
  const defaultFeed = {
    dataKey: '',
    totalKey: 'total',
    increaseKey: 'pn',
    scrollCheckFull: !feedOptionTemp.manual,
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
    onAfter: (params: P) => {
      list.value = getList();
      nothing.value = list.value.length === 0;
      feedOption?.onAfter?.(params);
    },
  });

  const getSSRCache = () => {
    if (!isSSR && option.asyncDataKey && option.SSR) {
      list.value = getList();
      if (!loading.value) {
        nothing.value = list.value.length === 0;
        feedOption?.onAfter?.(params.value);
      }
    }
  };
  // get total data list
  // tips: Object.keys Object.values ans so on will sort auto by key
  const getList = () => {
    const res = Object.values(parallelResults).reduce((pre, cur) => {
      const dadaKey = typeof defaultFeed.dataKey === 'string' ? defaultFeed.dataKey : defaultFeed.dataKey.value;
      const val = getByPath(cur.data!, dadaKey);
      return val && Array.isArray(val) ? pre.concat(val) : pre;
    }, [] as LR[]);
    return res;
  };

  const total = ref(option.feed?.total?.value ?? Number.MAX_SAFE_INTEGER);

  watch(
    dataTemp,
    (val) => {
      const key = typeof defaultFeed.totalKey === 'string' ? defaultFeed.totalKey : defaultFeed.totalKey.value;
      val && (total.value = option.feed?.total?.value ?? getByPath(val, key, 0));
    },
    {
      immediate: true,
    },
  );

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
    nothing.value = false;
    total.value = option.feed?.total?.value ?? Number.MAX_SAFE_INTEGER;
    list.value = [];
    Object.keys(parallelResults).forEach((key) => {
      delete parallelResults[key];
    });
    const params = feedOption?.defaultParams as P;
    unobserveEvents();
    load(...params);
    observerEvents();
  };

  getSSRCache();

  // observer dom to load more auto
  let destroyObserver: Function;

  const observerEvents = () => {
    const containerEl = option?.feed?.containerRef?.value?.$el || option?.feed?.containerRef?.value;
    if (containerEl) {
      const status = computed(() => !!rest?.error.value || loading.value || nothing.value || noMore.value);
      destroyObserver = onScroll(defaultFeed, loadMore, status)!;
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
