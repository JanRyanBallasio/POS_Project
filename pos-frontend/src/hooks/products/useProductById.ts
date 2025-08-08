import useSWR from "swr";
import { productApi } from "./useProductApi";

export function useProductById(id?: number) {
  return useSWR(id ? ["product", id] : null, () => productApi.getById(id!));
}