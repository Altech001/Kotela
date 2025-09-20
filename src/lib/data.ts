
import type { Boost } from './types';

// This file is now only used for the initial seeding of the database.
// The primary source of truth for store items is the 'boosts' collection in Firestore.
export const storeItems: Boost[] = [
  {
    id: 'bot-1',
    name: 'Mining Bot v1',
    description: 'Mines 1 KTC/hour while you are offline or away.',
    cost: 500,
    type: 'mining_bot',
    value: 1,
    status: 'available',
  },
  {
    id: 'multiplier-2x',
    name: '2x Score Multiplier',
    description: 'Doubles your KTC mining rate for 5 seconds.',
    cost: 150,
    type: 'score_multiplier',
    value: 2,
    status: 'available',
  },
   {
    id: 'multiplier-3x',
    name: '3x Score Multiplier',
    description: 'Triples your KTC mining rate for 5 seconds.',
    cost: 400,
    type: 'score_multiplier',
    value: 3,
    status: 'available',
  },
  {
    id: 'extra-time-10',
    name: '+10s Game Time',
    description: 'Adds 10 seconds to your next game.',
    cost: 250,
    type: 'extra_time',
    value: 10,
    status: 'available',
  },
  {
    id: 'extra-time-20',
    name: '+20s Game Time',
    description: 'Adds 20 seconds to your next game.',
    cost: 450,
    type: 'extra_time',
    value: 20,
    status: 'available',
  },
  {
    id: 'time-freeze-5',
    name: 'Freeze Time',
    description: 'Pause the timer for 5s.',
    cost: 2000,
    type: 'time_freeze',
    value: 5,
    status: 'available',
  },
];
