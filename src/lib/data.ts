import type { Boost, LeaderboardEntry, NewsItem } from './types';

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

export const newsData: NewsItem[] = [
  {
    id: '1',
    title: 'Welcome to Kotela!',
    content: 'The new era of tap-to-earn gaming has begun. Start tapping to mine your first Kotela Coins (KTC) and climb the leaderboards!',
    timestamp: '2024-07-29T10:00:00Z',
    author: 'The Kotela Team',
    imageUrl: 'https://picsum.photos/seed/news1/600/400',
    imageHint: 'celebration confetti'
  },
  {
    id: '2',
    title: 'New Mining Bots in Store',
    content: 'Boost your offline earnings with our new Mining Bots! Head to the store now to check them out and start earning KTC while you sleep.',
    timestamp: '2024-07-28T15:30:00Z',
    author: 'Dev Team',
    imageUrl: 'https://picsum.photos/seed/news2/600/400',
    imageHint: 'robot technology'
  },
  {
    id: '3',
    title: 'Community Highlight: Top Tappers',
    content: 'A huge shoutout to our top players this week! CryptoKing is leading the charge with an incredible score. Can you catch up?',
    timestamp: '2024-07-27T12:00:00Z',
    author: 'Community Manager',
    imageUrl: 'https://picsum.photos/seed/news3/600/400',
    imageHint: 'trophy award'
  },
];
