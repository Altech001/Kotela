'use client';
import type { User, Transaction } from '@/lib/types';
import { createContext } from 'react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, extraData?: Partial<User>) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  transferKtc: (recipientIdentifier: string, amount: number) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
