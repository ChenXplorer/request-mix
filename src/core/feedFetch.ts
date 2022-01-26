import { getByPath, merge } from 'src/utils';
import { computed, Ref, watch } from 'vue';
import { BaseOptions } from '../types/options';
import { HttpRequest } from '../types/request';
import { baseFetch } from './baseFetch';

export type Feed = {
  dataKey: string;
  totalKey: string;
  increaseKey: string;
  increaseStep: number;
  loadingRef: Ref<Element | null | undefined>;
};

export type FeedOption<P extends unknown[], R> = Omit<BaseOptions<P, R>, 'parallelKey'> & { feed: Partial<Feed> };

export function feedFetch<P extends unknown[], R>(request: HttpRequest<P, R>, option: FeedOption<P, R>) {
  const { feed, ...feedOptionTemp } = option;

  const defaultFeed = {
    dataKey: 'list',
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

  const { data, parallelResults, load, params, ...rest } = baseFetch(request, {
    ...feedOption,
    parallelKey: (...args: P) => (args?.[0] as Object)?.[defaultFeed.increaseKey] + '',
  });

  // get total data list
  // tips: Object.keys Object.values ans so on will sort auto by key
  const list = computed(() =>
    Object.values(parallelResults).reduce((pre, cur) => {
      const result = getByPath(cur.data!, defaultFeed.dataKey);
      return result && Array.isArray(result) ? pre.concat(result) : pre;
    }, [] as any[]),
  );

  const total = computed(() => getByPath(data.value!, defaultFeed.totalKey, 0));

  const noMore = computed(() => list.value.length >= total.value);

  const loadMore = () => {
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
    // todo delete parallelResult and reset params
  };

  // observer dom to load more auto

  let feedObserver: IntersectionObserver;

  if (option?.feed?.loadingRef) {
    watch(
      option.feed.loadingRef,
      (cur, old) => {
        if (cur && !old) {
          feedObserver = new IntersectionObserver((entries) => {
            if (entries[0].intersectionRatio <= 0) return;
            loadMore();
          });
          feedObserver.observe(cur);
        }
        if (!cur && old) {
          feedObserver.unobserve(old);
          feedObserver.disconnect();
        }
      },
      {
        immediate: true,
      },
    );
  }

  return {
    ...rest,
    list,
    data,
    total,
    noMore,
    params,
    loadMore,
  };
}
