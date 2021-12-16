import { BaseOptions } from "src/types/options";
import { HttpRequest } from "../types/request";
import { createHttpRequest } from "./createHttpRequest";
import { genRequest } from "./genRequest";

function useHttp<P extends unknown[], R>(
  request: HttpRequest<P, R>,
  options: BaseOptions<P, R>
) {
  const query = genRequest(request);
  const { load, loading, error, data } = createHttpRequest<P, R>(query);
  const { defaultParams = ([] as unknown) as P, manual } = options;
  if (!manual) {
    load(...defaultParams);
  }
  return {
    load,
    loading,
    error,
    data,
  };
}
