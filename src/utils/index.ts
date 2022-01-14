import { State, UnwrapRefs } from '../types/request';

export async function fetchHttp(url: string, options?: Partial<RequestInit>) {
  const res = await fetch(url, options);
  if (res.ok) {
    return res.json();
  }
  throw new Error(res.statusText);
}

export const throwWarning = (warning: string, throwOut = false) => {
  const message = `Warning: vue-http-hook ${warning}`;
  if (throwOut) {
    return new Error(message);
  }
  console.error(message);
};

export const isFunction = (val: unknown): val is Function => val instanceof Function;
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isPlainObject = (val: unknown): val is Record<string, any> =>
  Object.prototype.toString.call(val) === '[object object]';

export const setStateMap = <P extends unknown[], R>(oldState: State<P, R>) => {
  return (newState: Partial<UnwrapRefs<State<P, R>>>) => {
    Object.keys(newState).forEach((key) => (oldState[key].value = newState[key]));
  };
};
