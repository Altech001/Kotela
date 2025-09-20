
export type Wallet = {
  id: string;
  network: string;
  address: string;
  status: 'active' | 'inactive';
};

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
  isPhoneVerified: boolean;
  phoneNumber?: string;
  phoneHolderName?: string;
  wallets: Wallet[];
  referredBy?: string; // ID of the user who referred this user
  otpHash?: string;
  otpExpiry?: string; // ISO string
};

export type Notification = {
    id: string;
    userId: string;
    title: string;
    description: string;
    timestamp: string; // ISO string
    isRead: boolean;
}

export type Boost = {
  id:string;
  name: string;
  description: string;
  cost: number;
  type: 'score_multiplier' | 'extra_time' | 'time_freeze' | 'mining_bot' | 'scoreBomb' | 'frenzy';
  value: number; // e.g., 2 for 2x multiplier, 10 for 10 extra seconds
  status: 'available' | 'sold';
  free?: boolean;
  adUrl?: string;
};

export type Powerup = {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'permanent_multiplier' | 'bot_upgrade' | 'score_multiplier' | 'extra_time' | 'time_freeze' | 'frenzy' | 'scoreBomb';
  value: number;
  status: 'available' | 'sold';
  maxQuantity: number;
  free?: boolean;
  adUrl?: string;
};

export type UserBoost = {
  boostId: string;
  quantity: number;
  instanceId?: string; // For individual bot instances
  active?: boolean;    // For bot status
  type?: string;
};

export type UserPowerup = {
  powerupId: string;
  purchasedAt: string;
  quantity: number;
};

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
    name: string;
    type: Boost['type'] | Powerup['type'];
    value: number;
    endTime: number; // timestamp
  } | null;
}

export type MobileMoneyAccount = {
    id: string;
    userId: string;
    provider: string; // e.g., 'MTN', 'Airtel'
    number: string;
    name: string;
    createdAt: string; // ISO string
};

export type Announcement = {
  text: string;
  date: string;
  href?: string;
};
