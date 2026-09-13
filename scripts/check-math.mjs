// Lightweight sanity checks without a test runner.
const n = (v) => {
  const x = Number(String(v || '').replace(',', '.').trim());
  return Number.isFinite(x) ? x : 0;
};
function hasSplit(split) {
  if (!split) return false;
  return [split.materials, split.packaging, split.fees].some((v) => String(v || '').trim() !== '');
}
function calc(x, split) {
  const splitCost = hasSplit(split) ? n(split.materials) + n(split.packaging) + n(split.fees) : 0;
  const cost = hasSplit(split) ? splitCost : n(x.cost);
  const leftover = n(x.yield) * n(x.price) - cost;
  return {
    cost,
    leftover,
    perUnit: n(x.yield) ? leftover / n(x.yield) : 0,
    breakEven: n(x.price) > 0 ? Math.ceil(cost / n(x.price)) : 0
  };
}

const a = calc({cost: '20', minutes: '60', yield: '4', price: '8'});
if (a.cost !== 20 || a.leftover !== 12 || a.perUnit !== 3 || a.breakEven !== 3) {
  console.error('base calc failed', a);
  process.exit(1);
}

const b = calc({cost: '99', minutes: '10', yield: '2', price: '5'}, {materials: '0', packaging: '0', fees: '0'});
if (b.cost !== 0) {
  console.error('zero split must not fall back to lump cost', b);
  process.exit(1);
}

const c = calc({cost: '40', minutes: '10', yield: '2', price: '5'}, {materials: '', packaging: '', fees: ''});
if (c.cost !== 40) {
  console.error('empty split should use lump cost', c);
  process.exit(1);
}

console.log('math checks passed');
