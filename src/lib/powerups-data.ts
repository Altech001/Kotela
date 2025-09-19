
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
];
