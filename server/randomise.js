// Condition assignment. Server-side, committed to storage at session creation.
//
//  simple – each participant drawn independently with probability 25% per cell (protocol §3 wording).
//  block  – permuted blocks of four: every run of four consecutive sessions contains each condition
//           exactly once, so cell sizes never differ by more than one. Marginal probability per
//           participant is still 25%. Opt in with RANDOMISATION=block.

import { randomInt } from 'node:crypto';
import { countStartedSessions, getMeta, setMeta } from './db.js';

const CONDITIONS = ['A', 'B', 'C', 'D'];

export function simpleAssignment() {
  return CONDITIONS[randomInt(CONDITIONS.length)];
}

export function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Permuted-block assignment persisted in the meta table. Call inside a transaction with createSession. */
export function blockAssignment(dbs) {
  const n = countStartedSessions(dbs);
  const position = n % CONDITIONS.length;
  let block;
  if (position === 0 || !getMeta(dbs, 'current_block')) {
    block = shuffled(CONDITIONS);
    setMeta(dbs, 'current_block', JSON.stringify(block));
  } else {
    block = JSON.parse(getMeta(dbs, 'current_block'));
  }
  return block[position];
}

export function assignCondition(dbs, mode) {
  return mode === 'block' ? blockAssignment(dbs) : simpleAssignment();
}
