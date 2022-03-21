import { getByPath, isInClient, merge } from '../utils';
import { computed, onMounted, onUnmounted, nextTick, onUpdated, ref, Ref, watch, watchEffect } from 'vue';
import { BaseOptions } from '../types/options';
import { HttpRequest } from '../types/request';
import { baseFetch } from './baseFetch';

export type Feed = {
  dataKey: string;
  totalKey: string;
  total: Ref<number>;
  loadingOffset: number;
  noMore: Ref<boolean>;
  increaseKey: string;
  increaseStep: number;
  loadingRef: Ref<HTMLElement | null | undefined>;
  containerRef: Ref<any>;
};

export type FeedOption<P extends unknown[], R> = Omit<BaseOptions<P, R>, 'parallelKey'> & { feed: Partial<Feed> };

export function feedFetch<P extends unknown[], R>(request: HttpRequest<P, R>, option: FeedOption<P, R>) {
  const { feed, ...feedOptionTemp } = option;

  const defaultFeed = {
    dataKey: '',
    totalKey: 'total',
    increaseKey: 'pn',
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
      const val = getByPath(cur.data!, defaultFeed.dataKey);
      return val && Array.isArray(val) ? pre.concat(val) : pre;
    }, [] as any[]);
    return res;
  });

  const data = ref(dataTemp.value) as Ref<R | null | undefined>;
  const total = ref(option.feed?.total?.value ?? 0);

  watch(dataTemp, (val) => {
    val && (total.value = option.feed?.total?.value ?? getByPath(val, defaultFeed.totalKey, 0));
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
    const firstKey = Object.keys(parallelResults)?.[0];
    Object.keys(parallelResults)
      .slice(1)
      .forEach((key) => {
        delete parallelResults[key];
      });

    load(...parallelResults[firstKey].params);
  };

  // observer dom to load more auto
  let feedObserver: IntersectionObserver;
  let observerMutation: MutationObserver;
  let loadingDiv: HTMLElement;

  onMounted(() => {
    const containerEl = option?.feed?.containerRef?.value?.$el || option?.feed?.containerRef?.value;
    loadingDiv = (() => {
      const div = document.createElement('div');
      div.setAttribute('style', `position: absolute; bottom:${defaultFeed.loadingOffset}px;`);
      return div;
    })();
    if (containerEl) {
      containerEl.style.position = 'relative';
      containerEl.appendChild(loadingDiv);
      feedObserver = new IntersectionObserver((entries) => {
        if (entries[0].intersectionRatio <= 0) return;
        if (!loading.value) {
          loadMore();
        }
      });
      // Is it necessary to fill first load screen
      observerMutation = new MutationObserver(async () => {
        await nextTick();
        const inClient = isInClient(loadingDiv);
        if (!loading.value && inClient) {
          loadMore();
        } else if (!inClient) {
          observerMutation.disconnect();
        }
      });
      observeEvents();
    }
  });

  function observeEvents() {
    const containerEl = option?.feed?.containerRef?.value?.$el || option?.feed?.containerRef?.value;
    feedObserver.observe(loadingDiv);
    observerMutation.observe(containerEl as Node, {
      childList: true,
    });
  }
  function unobserveEvents() {
    if (feedObserver) {
      feedObserver.unobserve(loadingDiv);
      feedObserver.disconnect();
    }
    if (observerMutation) {
      observerMutation.disconnect();
    }
  }
  onUnmounted(() => {
    unobserveEvents();
  });

  return {
    ...rest,
    list,
    loading,
    data,
    total,
    noMore,
    params,
    loadMore,
    refresh,
    unobserveEvents,
    observeEvents,
  };
}
