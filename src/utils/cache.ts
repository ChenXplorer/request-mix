import { State, UnwrapRefs } from '../types/request';
import { CacheData, Cache } from '../types/cache';
import { DEFAULT_PARALLEL_KEY } from './cons';
import { unrefObj } from './index';

class CacheMap {
  private _cache;
  constructor() {
    this._cache = new Map<string, Cache<any>>();
  }
  get<P extends unknown[], R>(key: string): Cache<CacheData<P, R>> | undefined {
    if (!key) return;
    const result = this._cache.get(key);
    return result ?? undefined;
  }
  set<P extends unknown[], R>(key: string, data: CacheData<P, R>, cacheTime: number) {
    const old = this.get<P, R>(key);
    if (old?.timer) {
      clearTimeout(old.timer);
    }
    const timer = setTimeout(() => {
      this._cache.delete(key);
    }, cacheTime);
    this._cache.set(key, { data, timer });
  }
  update<P extends unknown[], R>(key: string, state: State<P, R>, cacheTime: number, parallelKey: string) {
    if (!key) return;
    const oldCache = this.get<P, R>(key);
    const oldParallelsResults = oldCache?.data.parallelResults;
    const currentParallelKey = parallelKey ?? DEFAULT_PARALLEL_KEY;
    const currentParallelResult = oldParallelsResults?.[currentParallelKey];
    const newState = unrefObj(state);
    this.set<P, R>(
      key,
      {
        parallelResults: {
          ...oldParallelsResults,
          [currentParallelKey]: {
            ...currentParallelResult,
            ...newState,
          },
        },
        currentParallelKey,
      },
      cacheTime,
    );
  }
  clearByKey(key: string) {
    const cache = this._cache.get(key);
    cache?.timer ? clearTimeout(cache.timer) : null;
    this._cache.delete(key);
  }
  clearAll() {
    this._cache.forEach((c) => (c?.timer ? clearTimeout(c.timer) : null));
    this._cache.clear();
  }
}

export const CACHE = new CacheMap();
