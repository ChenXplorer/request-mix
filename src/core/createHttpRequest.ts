import { Mutate, Query } from '../types/request';
import { Ref, ref } from 'vue';
import { HttpRequestResult } from '../types/request';
import { isFunction, setStateMap } from '../utils';

export const createHttpRequest = <P extends unknown[], R>(query: Query<P, R>): HttpRequestResult<P, R> => {
  const loading = ref(false);
  const error = ref();
  const data = <Ref<R>>ref();

  const setState = setStateMap({
    loading,
    error,
    data,
  });

  const load = (...args: P) => {
    setState({
      loading: true,
      error: null,
      data: null,
    });
    return query(...args)
      .then((res) => {
        const result = res;
        setState({
          data: result,
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        setState({
          data: null,
          loading: false,
          error: error,
        });
      });
  };

  const mutate: Mutate<R> = (value) => {
    const newData = isFunction(value) ? value(data.value) : value;
    setState({
      data: newData,
    });
  };

  return {
    loading,
    error,
    data,
    load,
    mutate,
  };
};
