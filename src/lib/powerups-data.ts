
import type { Powerup } from './types';

// This file is used for the initial seeding of the 'powerups' collection in Firestore.
export const powerupItems: Powerup[] = [
  {
    id: 'perm-multiplier-1.5x',
    name: 'Permanent 1.5x Multiplier',
    description: 'Permanently increases your base mining rate by 50%.',
    cost: 10000,
    type: 'permanent_multiplier',
    value: 1.5,
    status: 'available',
    maxQuantity: 1,
  },
  {
    id: 'bot-upgrade-1',
    name: 'Mining Bot Upgrade',
    description: 'Doubles the offline mining rate of your bots.',
    cost: 7500,
    type: 'bot_upgrade',
    value: 2,
    status: 'available',
    maxQuantity: 1
  },
  {
    id: 'extraTime',
    name: 'Extra Time',
    description: 'Adds 10 seconds to the game.',
    cost: 0,
    type: 'extra_time',
    value: 10,
    status: 'available',
    maxQuantity: 99,
    free: true,
    adUrl: 'https://www.youtube.com/embed/R3GfuzLMPkA?autoplay=1',
  },
  {
    id: 'freezeTime',
    name: 'Freeze Time',
    description: 'Pause the timer for 5s.',
    cost: 2000,
    type: 'time_freeze',
    value: 5,
    status: 'available',
    maxQuantity: 99,
  },
];
