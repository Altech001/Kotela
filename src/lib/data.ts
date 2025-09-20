
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
    id: 'missile',
    name: 'Missile Boost',
    description: '3x coin multiplier for 3s.',
    cost: 1500,
    type: 'missile',
    value: 3,
    status: 'available',
  },
  {
    id: 'frenzy',
    name: 'Frenzy',
    description: 'Auto-mine for 3 seconds.',
    cost: 2500,
    type: 'frenzy',
    value: 5,
    status: 'available',
  },
  {
    id: 'scoreBomb',
    name: 'Score Bomb',
    description: 'Instantly adds 25 KTC to your score.',
    cost: 1000,
    type: 'scoreBomb',
    value: 25,
    status: 'available',
  },
  {
    id: 'rocket',
    name: 'Rocket',
    description: 'A 2x coin multiplier for 5s.',
    cost: 500,
    type: 'rocket',
    value: 2,
    status: 'available',
  },
];
