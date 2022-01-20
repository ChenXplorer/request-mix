import { BaseOptions, Pagination } from '../types/options';
import { HttpRequest } from 'src/types/request';
import { getByPath, merge } from '../utils';
import { baseFetch } from './baseFetch';
import { computed } from 'vue';
export type PaginationOption<P extends unknown[], R> = Omit<BaseOptions<P, R>, 'parallelKey'>;

export function paginationFetch<P extends unknown[], R>(request: HttpRequest<P, R>, options?: PaginationOption<P, R>) {
  const { pagination, ...paginationOptionTemp } = options ?? {};
  /* need request params is object as 
    test( params: {pn:1,ps:10}) 
    not test(pn,ps)
  */

  // TODO limit defaultParams as [{}] format
  const defaultPagination: Pagination = {
    ...pagination,
    pnKey: 'pn',
    psKey: 'ps',
    totalKey: 'total',
    totalPageKey: 'totalPage',
  };
  const paginationParams = {
    [defaultPagination.pnKey]: 1,
    [defaultPagination.psKey]: 10,
  };
  const paginationOption = merge(
    {
      defaultParams: [
        {
          [defaultPagination.pnKey]: 1,
          [defaultPagination.psKey]: 10,
        },
      ],
    },
    paginationOptionTemp,
  );

  const { data, load, params, parallelResults, ...rest } = baseFetch<P, R>(request, paginationOption);

  const run = (value: { [key: string]: number }) => {
    // TODO 类型重新定义
    const a = params.value;
    const [defaultParams, ...rest] = params.value;
    const curParams = [
      {
        ...(defaultParams as any),
        ...value,
      },
      ...rest,
    ] as P;
    load(...curParams);
  };

  const pn = computed({
    get: () => {},
    set: () => {},
  });
  const ps = computed({
    get: () => {},
    set: () => {},
  });
  const totalPage = computed(() =>
    getByPath(data.value!, defaultPagination.totalPageKey, Math.ceil(total.value / ps.value)),
  );
  const total = computed(() => getByPath(data.value!, defaultPagination.totalKey, 0));

  const change = (value: { pn?: number; ps?: number }) => {
    const changeParams = {};
    value.pn ? (changeParams[defaultPagination.pnKey] = pn) : null;
    value.ps ? (changeParams[defaultPagination.psKey] = pn) : null;
    run(changeParams);
  };

  return {
    data,
    load,
    pn,
    ps,
    total,
    totalSize,
    change,
    params,
    ...rest,
  };
}
