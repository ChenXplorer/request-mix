import { HttpRequest, Query } from './../types/request';
import { ref } from '@vue/runtime-core';
import { QueryResult } from 'src/types/request';
import { genRequest } from './genRequest';
import { setStateMap } from '../utils';

export const createHttpRequest = <P extends unknown[], R>(query: Query<P, R>): QueryResult<P, R> => {
  const loading = ref(false);
  const error = ref(null);
  const data = ref<R>();

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

  return {
    loading,
    error,
    data,
    load,
  };
};
