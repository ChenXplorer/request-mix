import { BaseOptions, Pagination, HttpRequest, PaginationResult, PaginationOption } from '../types';
import { getByPath, merge } from '../utils';
import { baseFetch } from './baseFetch';
import { computed, ComputedRef } from 'vue';

export function paginationFetch<P extends unknown[], R>(
  request: HttpRequest<P, R>,
  options?: PaginationOption<P, R>,
): PaginationResult<P, R> {
  const { pagination, ...paginationOptionTemp } = options ?? {};
  /* need request params is object as 
    test( params: {pn:1,ps:10}) 
    not test(pn,ps)
  */

  // TODO limit defaultParams as [{}] format
  // TODO 支持 offset 查询方式
  // 或者告知 pn ，ps 在 defaultparams 的 index
  const defaultPagination: Pagination = {
    pnKey: 'pn',
    psKey: 'ps',
    totalKey: 'total',
    totalPageKey: 'totalPage',
    ...pagination,
  };
  const defaultPaginationParams = {
    [defaultPagination.pnKey]: 1,
    [defaultPagination.psKey]: 10,
  };
  const paginationOption = merge(
    {
      defaultParams: [
        {
          ...defaultPaginationParams,
        },
      ],
    },
    paginationOptionTemp,
  );

  const { data, load, params, parallelResults, ...rest } = baseFetch<P, R>(request, paginationOption);

  const run = (value: { [key: string]: number }) => {
    // TODO 类型重新定义
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

  const change = (value: { pn?: number; ps?: number }) => {
    const changeParams = {};
    value.pn ? (changeParams[defaultPagination.pnKey] = pn) : null;
    value.ps ? (changeParams[defaultPagination.psKey] = pn) : null;
    run(changeParams);
  };

  // TODO params.value?.[0]类型重新定义
  const paramsPagination = computed(() => params.value?.[0]) as ComputedRef<Object>;

  const pn = computed({
    get: () =>
      paramsPagination.value?.[defaultPagination.pnKey] ?? paginationOption.defaultParams[0][defaultPagination.pnKey],
    set: (val: number) => {
      change({
        pn: val,
      });
    },
  });
  const ps = computed({
    get: () =>
      paramsPagination.value?.[defaultPagination.psKey] ?? paginationOption.defaultParams[0][defaultPagination.psKey],
    set: (val: number) => {
      change({
        ps: val,
      });
    },
  });
  const totalPage = computed(() =>
    getByPath(data.value!, defaultPagination.totalPageKey, Math.ceil(total.value / ps.value)),
  );
  const total = computed(() => getByPath(data.value!, defaultPagination.totalKey, 0));

  return {
    ...rest,
    parallelResults,
    data,
    load,
    pn,
    ps,
    total,
    totalPage,
    change,
    params,
  };
}
