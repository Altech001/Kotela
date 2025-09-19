import type { Boost, LeaderboardEntry } from './types';

export const storeItems: Boost[] = [
  {
    id: 'bot-1',
    name: 'Mining Bot v1',
    description: 'Automatically mines 1 KTC per hour even when you are offline.',
    cost: 500,
    type: 'mining_bot',
    value: 1,
  },
  {
    id: 'multiplier-2x',
    name: '2x Score Multiplier',
    description: 'Doubles your KTC earnings for one game.',
    cost: 100,
    type: 'score_multiplier',
    value: 2,
  },
  {
    id: 'extra-time-10',
    name: '+10 Seconds',
    description: 'Adds 10 extra seconds to your game time.',
    cost: 150,
    type: 'extra_time',
    value: 10,
  },
  {
    id: 'time-freeze-5',
    name: 'Time Freeze',
    description: 'Freezes the timer for 5 seconds.',
    cost: 200,
    type: 'time_freeze',
    value: 5,
  },
];

export const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, name: 'CryptoKing', score: 10520, avatarUrl: 'https://picsum.photos/seed/user1/40/40' },
  { rank: 2, name: 'CoinMaster', score: 9870, avatarUrl: 'https://picsum.photos/seed/user2/40/40' },
  { rank: 3, name: 'SatoshiJr', score: 9500, avatarUrl: 'https://picsum.photos/seed/user3/40/40' },
  { rank: 4, name: 'TapTitan', score: 8800, avatarUrl: 'https://picsum.photos/seed/user4/40/40' },
  { rank: 5, name: 'You', score: 8500, avatarUrl: 'https://picsum.photos/seed/you/40/40' },
  { rank: 6, name: 'BitMiner', score: 7900, avatarUrl: 'https://picsum.photos/seed/user6/40/40' },
  { rank: 7, name: 'TokenTapper', score: 7650, avatarUrl: 'https://picsum.photos/seed/user7/40/40' },
];
