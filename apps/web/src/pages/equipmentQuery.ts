import type { EquipmentQuery } from '@app/shared';

/** URL search params → API query. Shared by the route loader (SSR) and the page so keys match. */
export function parseEquipmentQuery(sp: URLSearchParams): EquipmentQuery {
  const num = (k: string) => {
    const v = Number(sp.get(k));
    return sp.get(k) && Number.isFinite(v) && v >= 0 ? v : undefined;
  };
  const op = sp.get('operator');
  return {
    ...(sp.get('category') ? { category: sp.get('category')! } : {}),
    ...(num('min') !== undefined ? { capacityMin: num('min') } : {}),
    ...(num('max') !== undefined ? { capacityMax: num('max') } : {}),
    ...(op === 'with' || op === 'without' ? { operator: op } : {}),
    pageSize: 48,
  };
}
