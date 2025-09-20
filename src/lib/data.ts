
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
    id: 'missile',
    name: 'Missile Boost',
    description: '3x coin multiplier for 3s.',
    cost: 1500,
    type: 'score_multiplier',
    value: 3,
    status: 'available',
  },
  {
    id: 'extra-time-10',
    name: 'Extra Time',
    description: 'Adds 10 seconds to the game.',
    cost: 0,
    type: 'extra_time',
    value: 10,
    status: 'available',
    free: true,
    adUrl: 'https://www.youtube.com/embed/R3GfuzLMPkA?autoplay=1',
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
  {
    id: 'frenzy',
    name: 'Frenzy',
    description: 'Auto-mine for 3 seconds.',
    cost: 2500,
    type: 'score_multiplier', // Can be handled as a high multiplier
    value: 5, // Represents a 5x mining rate for frenzy
    status: 'available',
  },
];
