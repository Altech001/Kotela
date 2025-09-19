'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import type { User } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';


const createUserObject = (firebaseUser: FirebaseUser, extraData: Partial<User> = {}): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || 'no-email@example.com',
  name: firebaseUser.displayName || extraData.name || firebaseUser.email?.split('@')[0] || 'Player',
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // This case might happen if a user was created in auth but not in firestore
          // Let's create it now.
           const newUser = createUserObject(firebaseUser);
           await setDoc(userDocRef, newUser);
           setUser(newUser);
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
      // onAuthStateChanged will handle setting the user state
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, extraData: Partial<User> = {}) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const newUser = createUserObject(firebaseUser, extraData);
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      // onAuthStateChanged will handle setting user state, but we can set it here for faster UI update
      setUser(newUser);

    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, data);
      setUser((prev) => (prev ? { ...prev, ...data } : null));
    }
  }, [user]);

  const value = { user, loading, login, signup, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
