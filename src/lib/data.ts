import type { Boost } from './types';

export const storeItems: Boost[] = [
  {
    id: 'bot-1',
    name: 'Mining Bot v1',
    description: 'Automatically mines 1 KTC per hour even when you are offline.',
    cost: 500,
    type: 'mining_bot',
    value: 1,
    status: 'available',
  },
  {
    id: 'multiplier-2x',
    name: '2x Score Multiplier',
    description: 'Doubles your KTC earnings for one game.',
    cost: 100,
    type: 'score_multiplier',
    value: 2,
    status: 'available',
  },
  {
    id: 'extra-time-10',
    name: '+10 Seconds',
    description: 'Adds 10 extra seconds to your game time.',
    cost: 150,
    type: 'extra_time',
    value: 10,
    status: 'available',
  },
  {
    id: 'time-freeze-5',
    name: 'Time Freeze',
    description: 'Freezes the timer for 5 seconds.',
    cost: 200,
    type: 'time_freeze',
    value: 5,
    status: 'sold',
  },
];
