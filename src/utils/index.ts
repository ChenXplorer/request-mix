import { Ref, unref } from 'vue';
import { HttpRequest, State, UnRef, UnwrapRefs } from '../types/request';
import serialize from './serialize';

export async function fetchHttp(url: string, options?: Partial<RequestInit>) {
  const res = await fetch(url, options);
  if (res.ok) {
    return res.json();
  }
  throw new Error(res.statusText);
}

export const throwWarning = (warning: string, throwOut = false) => {
  const message = `Warning: request-mix ${warning}`;
  if (throwOut) {
    return new Error(message);
  }
  console.error(message);
};

export const isFunction = (val: unknown): val is Function => val instanceof Function;
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isPlainObject = (val: unknown): val is Record<string, any> =>
  Object.prototype.toString.call(val) === '[object object]';

export const setStateRelation = <P extends unknown[], R>(oldState: State<P, R>, cb?: (state: State<P, R>) => void) => {
  return (newState: Partial<UnwrapRefs<State<P, R>>>) => {
    Object.keys(newState).forEach((key) => (oldState[key].value = newState[key]));
    cb?.(oldState);
  };
};

export const unrefObj = (obj: { [key: string]: Ref<any> }): any => {
  const res = {};
  Object.keys(obj).forEach((o) => {
    res[o] = unref(obj[0]);
  });
  return res;
};

export function isObject(value: any) {
  const type = typeof value;
  return type !== null && (type === 'object' || type === 'function');
}

export function genRequest<P extends unknown[], R>(
  request: HttpRequest<P, R>,
): (() => Promise<R>) | ((...args: P) => Promise<R>) {
  return (...args: P) => {
    if (isFunction(request)) {
      return request(...args);
    }
    if (isString(request)) {
      return fetchHttp(request);
    }
    if (isPlainObject(request)) {
      const { url, ...res } = request;
      return fetchHttp(url, res);
    }
    throw throwWarning('unknown request type', true);
  };
}

export function merge(source: any, other: any) {
  if (!isObject(source) || !isObject(other)) {
    return other === undefined ? source : other;
  }
  if ((Array.isArray(source) && !Array.isArray(other)) || (!Array.isArray(source) && Array.isArray(other))) {
    return other;
  }

  return Object.keys({ ...source, ...other }).reduce(
    (acc, key) => {
      acc[key] = merge(source[key], other[key]);
      return acc;
    },
    Array.isArray(source) ? [] : {},
  );
}

export function getByPath(obj: Object, path: string, def: any = undefined) {
  if (!obj || Object.keys(obj).length === 0) return def;
  if (!path) return obj;
  const pathArr = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let result = obj;
  for (let i = 0; i < pathArr.length; i++) {
    result = result[pathArr[i]];
    if (result === undefined) {
      return def;
    }
  }
  return result;
}

export function isInClient(dom: HTMLElement) {
  const { top, right, bottom, left } = dom.getBoundingClientRect();
  const viewWidth = window?.innerWidth || document?.documentElement.clientWidth;
  const viewHeight = window?.innerHeight || document?.documentElement.clientHeight;
  const inClient = top >= 0 && left >= 0 && right <= viewWidth && bottom <= viewHeight;
  return inClient;
}

export function generateRequestKey(request: any, option: any = {}) {
  return serialize({
    request,
    option,
  });
}
