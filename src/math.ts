import {Numbers} from './types';

const n = (v: string) => {
  const x = Number(String(v || '').replace(',', '.').trim());
  return Number.isFinite(x) ? x : 0;
};

function hasSplit(split?: {materials: string; packaging: string; fees: string}) {
  if (!split) return false;
  return [split.materials, split.packaging, split.fees].some((v) => String(v || '').trim() !== '');
}

export function calc(x: Numbers, split?: {materials: string; packaging: string; fees: string}) {
  const splitCost = hasSplit(split)
    ? n(split!.materials) + n(split!.packaging) + n(split!.fees)
    : 0;
  const cost = hasSplit(split) ? splitCost : n(x.cost);
  const minutes = n(x.minutes);
  const yieldCount = n(x.yield);
  const price = n(x.price);
  const revenue = yieldCount * price;
  const leftover = revenue - cost;
  return {
    cost,
    minutes,
    yieldCount,
    price,
    leftover,
    perUnit: yieldCount ? leftover / yieldCount : 0,
    costPerUnit: yieldCount ? cost / yieldCount : 0,
    perHour: minutes ? leftover / (minutes / 60) : 0,
    breakEven: price > 0 ? Math.ceil(cost / price) : 0
  };
}

export function scenarioCalc(
  x: Numbers,
  scenarioPrice: string,
  split?: {materials: string; packaging: string; fees: string}
) {
  return calc({...x, price: scenarioPrice}, split);
}
