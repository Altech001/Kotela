
'use client';
import type { User, Transaction, Wallet } from '@/lib/types';
import { createContext } from 'react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, extraData?: Partial<User>) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  sendVerificationOtp: (phoneNumber: string, name: string) => Promise<string>;
  verifyPhoneNumber: (otp: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  transferKtc: (recipientIdentifier: string, amount: number) => Promise<void>;
  addWalletAddress: (network: string) => Promise<void>;
  deleteWalletAddress: (walletId: string) => Promise<void>;
  toggleWalletStatus: (walletId: string) => Promise<void>;
  toggleBotStatus: (userId: string, botInstanceId: string) => Promise<void>;
  deleteBot: (userId: string, botInstanceId: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
