import assert from 'node:assert/strict';
import test from 'node:test';
import {rankHobbies} from './quiz';
import {Hobby} from './types';

const hobbies: Hobby[] = [
  {id: 'baking', category: 'food', tags: ['make', 'sell', 'low', 'short'], image: ''},
  {id: 'web-design', category: 'digital', tags: ['make', 'sell', 'long'], image: ''},
  {id: 'photography', category: 'photo', tags: ['make', 'sell', 'short'], image: ''},
  {id: 'reselling', category: 'resale', tags: ['resell', 'sell', 'low', 'short'], image: ''}
];

test('the first answer changes the result category', () => {
  assert.equal(rankHobbies(hobbies, {fun: 'digital'})[0].id, 'web-design');
  assert.equal(rankHobbies(hobbies, {fun: 'photo'})[0].id, 'photography');
  assert.equal(rankHobbies(hobbies, {fun: 'resell'})[0].id, 'reselling');
});
