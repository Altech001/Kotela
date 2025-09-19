
import type { Boost } from './types';

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
    cost: 350,
    type: 'score_multiplier',
    value: 3,
    status: 'available',
  },
  {
    id: 'extra-time-10',
    name: '+10s Game Time',
    description: 'Adds 10 extra seconds to your next game.',
    cost: 200,
    type: 'extra_time',
    value: 10,
    status: 'available',
  },
  {
    id: 'time-freeze-5',
    name: '5s Time Freeze',
    description: 'Freezes the game timer for 5 seconds.',
    cost: 250,
    type: 'time_freeze',
    value: 5,
    status: 'available',
  },
  {
    id: 'extra-time-20',
    name: '+20s Game Time',
    description: 'Adds 20 extra seconds to your next game.',
    cost: 380,
    type: 'extra_time',
    value: 20,
    status: 'sold',
  },
];
