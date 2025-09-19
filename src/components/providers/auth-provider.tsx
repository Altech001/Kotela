'use client';

import { useState, useCallback, ReactNode } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import type { User } from '@/lib/types';

const MOCK_USER: User = {
  id: 'user-123',
  email: 'player@kotela.com',
  name: 'Player One',
  avatarUrl: 'https://picsum.photos/seed/you/100/100',
  ktc: 1000,
  boosts: [{ boostId: 'multiplier-2x', quantity: 1 }],
  transactions: [],
  referralCode: 'KOTELA-123',
  isKycVerified: false,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [loading, setLoading] = useState(false);

  const login = useCallback((email: string) => {
    setLoading(true);
    setTimeout(() => {
      setUser({ ...MOCK_USER, email });
      setLoading(false);
    }, 1000);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  const value = { user, loading, login, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
