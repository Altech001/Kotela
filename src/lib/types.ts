

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
  totalMiningTime?: number; // Total time in seconds
  settings?: {
    showAnnouncements?: boolean;
  };
};

export type UserInventoryItem = {
  id: string; // Unique instance ID
  userId: string;
  itemId: string; // ID of the Boost or Powerup
  itemType: 'boost' | 'powerup';
  name: string;
  description: string;
  purchasedAt: string; // ISO string
  type: Boost['type'] | Powerup['type'];
};

export type Notification = {
    id: string;
    userId: string;
    title: string;
    description: string;
    timestamp: string; // ISO string
    isRead: boolean;
}

export type BotEffects = {
  ktcPerSecond?: number; // For active game mining
  ktcPerHour?: number;   // For background mining
  autoClick?: boolean;   // For auto-clicking functionality
  clickInterval?: number; // Interval in ms for auto-clicking
};

export type Boost = {
  id:string;
  name: string;
  description: string;
  cost: number;
  type: 'score_multiplier' | 'extra_time' | 'time_freeze' | 'mining_bot' | 'scoreBomb' | 'frenzy' | 'missile' | 'rocket';
  value: number; // e.g., 2 for 2x multiplier, 10 for 10 extra seconds
  status: 'available' | 'sold';
  free?: boolean;
  adUrl?: string;
  botType?: 'background' | 'active_clicking' | 'active_yield';
  durationHours?: number; // How long the bot lasts in hours
  effects?: BotEffects;
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
  instanceId: string;
  purchasedAt: string; // ISO string
  expiryTimestamp: number | null; // null for non-expiring boosts, timestamp for expiring ones
  active: boolean;
  botType?: 'background' | 'active_clicking' | 'active_yield';
  effects?: BotEffects;
  name: string;
};

export type UserPowerup = {
  powerupId: string;
  purchasedAt: string;
  quantity: number;
  value: number;
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
  actualDuration?: number; // in seconds, set when game ends
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
  id: string;
  title: string;
  description: string;
  date: string; // ISO String
  href?: string;
};

export type BonusGame = {
    id: string;
    name: string;
    description: string;
    icon: string; // SVG string
    order: number;
    cooldownMinutes?: number;
    durationMinutes?: number;
    availableTimestamp?: number;
};

export type Video = {
    id: number;
    title: string;
    duration: string;
    reward: number;
    youtubeId: string;
    watchTime: number;
};

export type KycSubmission = {
    id: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string; // ISO Date
    formData: {
        country: string;
        phoneNumber: string;
        surname: string;
        givenName?: string;
        middleName?: string;
        dob: string; // YYYY-MM-DD
        documentType: string;
        documentId: string;
        expiryDate: string; // YYYY-MM-DD
    };
    documentImage: string; // Base64
    selfieImage: string; // Base64
};
