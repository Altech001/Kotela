'use client';
import type { User } from '@/lib/types';
import { createContext } from 'react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
