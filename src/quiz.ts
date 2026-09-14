import {Hobby} from './types';

export type Fun = 'make' | 'digital' | 'photo' | 'resell';
export type Spend = 'low' | 'mid' | 'flex';
export type Time = 'short' | 'med' | 'long';
export type Goal = 'finish' | 'sell' | 'repeat';
export type QuizAnswers = {fun?: Fun; spend?: Spend; time?: Time; goal?: Goal};

function categoryMatches(hobby: Hobby, fun?: Fun) {
  if (!fun) return true;
  if (fun === 'digital') return hobby.category === 'digital';
  if (fun === 'photo') return hobby.category === 'photo';
  if (fun === 'resell') return hobby.category === 'resale';
  return ['food', 'craft', 'art', 'home'].includes(hobby.category);
}

export function rankHobbies(hobbies: Hobby[], answers: QuizAnswers) {
  const spendTag = answers.spend === 'low' ? 'low' : undefined;
  const timeTag = answers.time === 'med' ? 'medium' : answers.time;
  return hobbies.filter((hobby) => categoryMatches(hobby, answers.fun)).map((hobby) => {
    const spendMatch = !spendTag || hobby.tags.includes(spendTag);
    const timeMatch = !timeTag || hobby.tags.includes(timeTag);
    const goalMatch = answers.goal === 'repeat' ? hobby.tags.includes('sell') || hobby.tags.includes('resell') : answers.goal === 'sell' ? hobby.tags.includes('sell') : true;
    return {hobby, score: Number(spendMatch) * 4 + Number(timeMatch) * 3 + Number(goalMatch) * 2};
  }).sort((a, b) => b.score - a.score || a.hobby.id.localeCompare(b.hobby.id)).slice(0, 3).map(({hobby}) => hobby);
}
