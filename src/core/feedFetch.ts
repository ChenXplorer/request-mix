import { getByPath, merge } from '../utils';
import { computed, h, nextTick, onUpdated, ref, Ref, watch, watchEffect } from 'vue';
import { BaseOptions } from '../types/options';
import { HttpRequest } from '../types/request';
import { baseFetch } from './baseFetch';

export type Feed = {
  dataKey: string;
  totalKey: string;
  increaseKey: string;
  increaseStep: number;
  loadingRef: Ref<HTMLElement | null | undefined>;
  containerRef: Ref<HTMLElement | null | undefined>;
};

export type FeedOption<P extends unknown[], R> = Omit<BaseOptions<P, R>, 'parallelKey'> & { feed: Partial<Feed> };

export function feedFetch<P extends unknown[], R>(request: HttpRequest<P, R>, option: FeedOption<P, R>) {
  const { feed, ...feedOptionTemp } = option;

  const defaultFeed = {
    dataKey: '',
    totalKey: 'total',
    increaseKey: 'pn',
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

  const { data, parallelResults, load, params, loading, ...rest } = baseFetch(request, {
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

  const noMore = ref(false);

  const total = ref();

  const loadMore = () => {
    noMore.value = total && list.value.length >= total.value;
    if (noMore.value) return;
    const pre = (params.value[0] as Object)?.[defaultFeed.increaseKey] as number;
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

  watch(data, (val) => {
    if (val) {
      total.value = getByPath(val, defaultFeed.totalKey, 0);
    }
  });

  // observer dom to load more auto
  let feedObserver: IntersectionObserver;

  if (option?.feed?.containerRef) {
    const loadingDiv = (() => {
      const div = document.createElement('div');
      div.setAttribute('style', 'position: absolute;bottom:20px;height:100px;background:red;width:100%');
      return div;
    })();

    watch(
      option.feed.containerRef,
      (cur, old) => {
        if (cur && !old) {
          cur.style.position = 'relative';
          cur.appendChild(loadingDiv);
          feedObserver = new IntersectionObserver((entries) => {
            if (entries[0].intersectionRatio <= 0) return;
            loadMore();
          });
        }
        if (!cur && old) {
          feedObserver && feedObserver.unobserve(old);
          feedObserver && feedObserver.disconnect();
        }
      },
      {
        immediate: true,
      },
    );

    watch(
      () => list.value.length,
      (val, old) => {
        // when list is not null then observe loadingDiv
        if (val && !old) {
          feedObserver.observe(loadingDiv);
        }
        // judge the loadingDiv is in client, if not loadMore
        const { top, right, bottom, left } = loadingDiv.getBoundingClientRect();
        const viewWidth = window?.innerWidth || document?.documentElement.clientWidth;
        const viewHeight = window?.innerHeight || document?.documentElement.clientHeight;
        const inClient = top >= 0 && left >= 0 && right <= viewWidth && bottom <= viewHeight;
        if (inClient) {
          loadMore();
        }
      },
    );
  }

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
  };
}
