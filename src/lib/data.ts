

import type { Boost } from './types';

// This file is now only used for the initial seeding of the database.
// The primary source of truth for store items is the 'boosts' collection in Firestore.
export const storeItems: Boost[] = [
  {
    id: 'bot-bg-v1',
    name: 'Background Bot v1',
    description: 'Mines KTC for you while you are away.',
    cost: 500,
    type: 'mining_bot',
    botType: 'background',
    value: 1, // Legacy value, effects used now
    effects: { ktcPerHour: 1 },
    status: 'available',
  },
  {
    id: 'bot-autoclick-v1',
    name: 'Auto-Clicker Bot',
    description: 'Automatically starts games and taps for you. Lasts for 24 hours.',
    cost: 2000,
    type: 'mining_bot',
    botType: 'active_clicking',
    durationHours: 24,
    value: 1, // Legacy
    effects: { autoClick: true, clickInterval: 2000 }, // Clicks every 2 seconds
    status: 'available',
  },
  {
    id: 'bot-yield-v1',
    name: 'Super-Yield Bot',
    description: 'Generates 20 KTC per second during active games. Lasts for 1 hour.',
    cost: 5000,
    type: 'mining_bot',
    botType: 'active_yield',
    durationHours: 1,
    value: 20, // Legacy
    effects: { ktcPerSecond: 20 },
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
