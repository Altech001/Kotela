
export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  ktc: number;
  boosts: UserBoost[];
  powerups: UserPowerup[];
  transactions: Transaction[];
  referralCode: string;
  isKycVerified: boolean;
  walletAddresses: string[];
  referredBy?: string; // ID of the user who referred this user
};

export type Boost = {
  id:string;
  name: string;
  description: string;
  cost: number;
  type: 'score_multiplier' | 'extra_time' | 'time_freeze' | 'mining_bot';
  value: number; // e.g., 2 for 2x multiplier, 10 for 10 extra seconds
  status: 'available' | 'sold';
};

export type Powerup = {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'permanent_multiplier' | 'bot_upgrade';
  value: number;
  status: 'available' | 'sold';
  maxQuantity: 1;
};

export type UserBoost = {
  boostId: string;
  quantity: number;
};

export type UserPowerup = {
  powerupId: string;
  purchasedAt: string;
}

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'purchase';
  amount: number;
  timestamp: string;
  from?: string;
  to?: string;
  description: string;
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  avatarUrl: string;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  author: string;
  imageUrl: string;
  imageHint: string;
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  author: string;
  authorImage: string;
  date: string; // ISO String
  content: string;
}

export interface GameSession {
  userId: string;
  score: number;
  startTime: number; // timestamp
  expectedEndTime: number; // timestamp
  duration: number; // in seconds
  status: 'playing' | 'ended';
  activeBoost: {
    id: string;
    type: Boost['type'];
    value: number;
    endTime: number; // timestamp
  } | null;
}
