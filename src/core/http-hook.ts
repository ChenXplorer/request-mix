import { ref, Ref } from "vue";

import http from "@bilibili/http";
import { handlerConfig } from "../channel";
export interface InfiniteScroll {
  dom?: Element;
  queryKey: string;
}

export interface Query {
  [key: string]: any;
}

export interface Options {
  query?: Query;
  ssr?: boolean;
  infinite?: InfiniteScroll;
  getList?: Function;
  getTotal?: Function;
}

export function useRequest(url: string, options: Options) {
  const loading: Ref<boolean> = ref(false);
  const error: Ref<any> = ref(null);
  const data: Ref<any> = ref(undefined);
  const noMore: Ref<boolean> = ref(false);
  const nothing: Ref<boolean> = ref(false);
  const total: Ref<number> = ref(0);

  const requestQuery = ref(options.query);

  let lazyIo: IntersectionObserver;
  let infiniteIo: IntersectionObserver;

  const load = async (query: any) => {
    try {
      loading.value = true;
      error.value = null;
      nothing.value = false;
      let currentData = await http.get(url, query, handlerConfig());
      if (options.getTotal) {
        total.value = options.getTotal(currentData);
      }
      if (options.getList) {
        currentData = options.getList(currentData);
      }

      if (!options.infinite) {
        data.value = currentData;
        noMore.value = true;
      } else {
        data.value = (data.value || []).concat(currentData);
      }
    } catch (e) {
      console.log(e);
      error.value = e;
    }
    loading.value = false;
    nothing.value = !(data.value && data.value.length > 0) || !data.value;
  };

  // lazy load
  const lazyLoad = (dom: Element) => {
    lazyIo = new IntersectionObserver(async (entries) => {
      if (entries[0].intersectionRatio <= 0) return;
      await load(requestQuery.value);
      lazyIo.unobserve(dom);
    });

    lazyIo.observe(dom);
  };

  // immediate load
  if (options.ssr) {
    load(requestQuery.value);
  }

  // infinite scroll
  const loadMore = (dom: Element, query: Query) => {
    if (dom) {
      infiniteIo = new IntersectionObserver(async (entries) => {
        if (entries[0].intersectionRatio <= 0) return;
        if (options.infinite?.queryKey && requestQuery.value) {
          const keyQ = options.infinite.queryKey;
          requestQuery.value[keyQ] += 1;
          if (requestQuery.value[keyQ] > total.value) {
            noMore.value = true;
            return;
          }
        }
        const loadQuery = query ? query : requestQuery.value;
        load(loadQuery);
      });
      infiniteIo.observe(dom);
    }
  };

  const handleDisconnect = () => {
    if (lazyIo) {
      lazyIo.disconnect();
    }
    if (infiniteIo) {
      infiniteIo.disconnect();
    }
  };

  const refresh = (query: Query) => {
    requestQuery.value = query;
    data.value = null;
    load(query);
  };

  return {
    data,
    loading,
    total,
    error,
    noMore,
    nothing,
    refresh,
    lazyLoad,
    loadMore,
    handleDisconnect,
  };
}
