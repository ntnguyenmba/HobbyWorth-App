import {Numbers} from './types';
const n=(v:string)=>{const x=Number(v.replace(',','.'));return Number.isFinite(x)?x:0};
export function calc(x:Numbers,split?:{materials:string;packaging:string;fees:string}){const splitCost=split?n(split.materials)+n(split.packaging)+n(split.fees):0;const cost=splitCost||n(x.cost),minutes=n(x.minutes),yieldCount=n(x.yield),price=n(x.price),revenue=yieldCount*price,leftover=revenue-cost;return{cost,minutes,yieldCount,price,leftover,perUnit:yieldCount?leftover/yieldCount:0,perHour:minutes?leftover/(minutes/60):0,breakEven:price?Math.ceil(cost/price):0}}
