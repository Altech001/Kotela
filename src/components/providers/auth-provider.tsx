'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import type { User } from '@/lib/types';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';

const createUserFromFirebase = (firebaseUser: FirebaseUser, extraData: Partial<User> = {}): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || 'no-email@example.com',
  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Player',
  avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
  ktc: 1000,
  boosts: [],
  transactions: [],
  referralCode: `KOTELA-${firebaseUser.uid.slice(0, 6).toUpperCase()}`,
  isKycVerified: false,
  ...extraData,
});


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // In a real app, you'd fetch user profile from Firestore here
        // For now, we check if there's local user data from signup
        const localUser = localStorage.getItem('pendingUser');
        if (localUser) {
          const extraData = JSON.parse(localUser);
          setUser(createUserFromFirebase(firebaseUser, extraData));
          localStorage.removeItem('pendingUser');
        } else {
          setUser(createUserFromFirebase(firebaseUser));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, extraData: Partial<User> = {}) => {
    setLoading(true);
    try {
      // Temporarily store extra data to be picked up by onAuthStateChanged
      localStorage.setItem('pendingUser', JSON.stringify(extraData));
      await createUserWithEmailAndPassword(auth, email, password);
    } catch(e) {
      localStorage.removeItem('pendingUser');
      throw e;
    }
    finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  const value = { user, loading, login, signup, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
