
'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import type { User, Transaction, Boost, Powerup } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch, arrayUnion, runTransaction, or } from 'firebase/firestore';
import { storeItems as localStoreItems } from '@/lib/data';
import { powerupItems as localPowerupItems } from '@/lib/powerups-data';


const createWalletAddress = (uid: string) => `KTC_${uid.slice(0, 4)}${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 6)}`;

const createUserObject = (firebaseUser: FirebaseUser, extraData: Partial<User> = {}): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || 'no-email@example.com',
  name: firebaseUser.displayName || extraData.name || firebaseUser.email?.split('@')[0] || 'Player',
  avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
  ktc: 1000,
  boosts: [],
  powerups: [],
  transactions: [],
  referralCode: `KOTELA-${firebaseUser.uid.slice(0, 8).toUpperCase()}`,
  walletAddresses: [createWalletAddress(firebaseUser.uid)],
  isKycVerified: false,
  ...extraData,
});

async function initializeCollections() {
    const boostsRef = collection(db, 'boosts');
    const boostsSnapshot = await getDocs(boostsRef);
    if (boostsSnapshot.empty) {
        const batch = writeBatch(db);
        localStoreItems.forEach((item) => {
            const docRef = doc(boostsRef, item.id);
            batch.set(docRef, item);
        });
        await batch.commit();
        console.log("Initialized 'boosts' collection from local data.");
    }
    
    const powerupsRef = collection(db, 'powerups');
    const powerupsSnapshot = await getDocs(powerupsRef);
    if (powerupsSnapshot.empty) {
        const batch = writeBatch(db);
        localPowerupItems.forEach((item) => {
            const docRef = doc(powerupsRef, item.id);
            batch.set(docRef, item);
        });
        await batch.commit();
        console.log("Initialized 'powerups' collection from local data.");
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeCollections();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
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
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, extraData: Partial<User> & { referralCode?: string } = {}) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const newUser = createUserObject(firebaseUser, extraData);

      const batch = writeBatch(db);
      const usersRef = collection(db, 'users');

      if (extraData.referralCode && extraData.referralCode.trim() !== '') {
        const q = query(usersRef, where('referralCode', '==', extraData.referralCode));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const directReferrerDoc = querySnapshot.docs[0];
          const directReferrerData = directReferrerDoc.data() as User;

          const NEW_USER_BONUS = 100;
          const TIER_1_BONUS = 250;
          const TIER_2_BONUS = 50;

          newUser.ktc += NEW_USER_BONUS;
          newUser.referredBy = directReferrerDoc.id;
          const newUserBonusTx: Transaction = {
            id: `tx-${Date.now()}-signup-bonus`,
            type: 'deposit',
            amount: NEW_USER_BONUS,
            timestamp: new Date().toISOString(),
            description: `Signup bonus for using referral code ${extraData.referralCode}`,
          };
          newUser.transactions.push(newUserBonusTx);

          const directReferrerRef = doc(db, 'users', directReferrerDoc.id);
          const directReferrerBonusTx: Transaction = {
            id: `tx-${Date.now()}-referral-t1`,
            type: 'deposit',
            amount: TIER_1_BONUS,
            timestamp: new Date().toISOString(),
            description: `Referral bonus for ${newUser.email}`,
          };
          batch.update(directReferrerRef, { 
            ktc: directReferrerData.ktc + TIER_1_BONUS, 
            transactions: arrayUnion(directReferrerBonusTx) 
          });

          if (directReferrerData.referredBy) {
            const indirectReferrerRef = doc(db, 'users', directReferrerData.referredBy);
            const indirectReferrerDoc = await getDoc(indirectReferrerRef);
            if (indirectReferrerDoc.exists()) {
              const indirectReferrerData = indirectReferrerDoc.data() as User;
              const indirectReferrerBonusTx: Transaction = {
                 id: `tx-${Date.now()}-referral-t2`,
                 type: 'deposit',
                 amount: TIER_2_BONUS,
                 timestamp: new Date().toISOString(),
                 description: `Tier 2 referral bonus from ${newUser.email}`,
              };
               batch.update(indirectReferrerRef, {
                 ktc: indirectReferrerData.ktc + TIER_2_BONUS,
                 transactions: arrayUnion(indirectReferrerBonusTx)
               });
            }
          }
        }
      }
      
      const newUserRef = doc(db, 'users', firebaseUser.uid)
      batch.set(newUserRef, newUser);

      await batch.commit();
      
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

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    if (user) {
      const newTransaction: Transaction = {
        ...transaction,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        transactions: arrayUnion(newTransaction),
      });

      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          transactions: [...(prev.transactions || []), newTransaction],
        };
      });
    }
  }, [user]);

  const transferKtc = useCallback(async (recipientIdentifier: string, amount: number) => {
    if (!user) throw new Error("You must be logged in to transfer KTC.");
    if (recipientIdentifier === user.referralCode || (user.walletAddresses || []).includes(recipientIdentifier)) {
      throw new Error("You cannot send KTC to yourself.");
    }

    try {
        await runTransaction(db, async (transaction) => {
            const usersRef = collection(db, 'users');
            
            const recipientQuery = query(usersRef, or(
                where('referralCode', '==', recipientIdentifier),
                where('walletAddresses', 'array-contains', recipientIdentifier)
            ));
            const recipientSnapshot = await getDocs(recipientQuery);

            if (recipientSnapshot.empty) {
                throw new Error("Recipient not found.");
            }
            const recipientDoc = recipientSnapshot.docs[0];
            const recipientData = recipientDoc.data() as User;
            const recipientRef = doc(db, 'users', recipientDoc.id);

            const senderRef = doc(db, 'users', user.id);
            const senderDoc = await transaction.get(senderRef);
            if (!senderDoc.exists()) {
                throw new Error("Sender not found.");
            }
            const senderData = senderDoc.data() as User;
            if (senderData.ktc < amount) {
                throw new Error("Insufficient funds.");
            }

            const newSenderKtc = senderData.ktc - amount;
            const newRecipientKtc = recipientData.ktc + amount;

            const now = new Date().toISOString();
            const txId = `tx-${Date.now()}`;

            const senderTx: Transaction = {
                id: `${txId}-send`,
                type: 'transfer',
                amount: amount,
                timestamp: now,
                from: user.id,
                to: recipientDoc.id,
                description: `Sent to ${recipientData.name}`,
            };

            const recipientTx: Transaction = {
                id: `${txId}-receive`,
                type: 'transfer',
                amount: amount,
                timestamp: now,
                from: user.id,
                to: recipientDoc.id,
                description: `Received from ${senderData.name}`,
            };
            
            transaction.update(senderRef, { ktc: newSenderKtc, transactions: arrayUnion(senderTx) });
            transaction.update(recipientRef, { ktc: newRecipientKtc, transactions: arrayUnion(recipientTx) });

             setUser((prev) => {
                if (!prev) return null;
                return {
                ...prev,
                ktc: newSenderKtc,
                transactions: [...(prev.transactions || []), senderTx],
                };
            });
        });
    } catch (error) {
        console.error("KTC Transfer failed: ", error);
        throw error;
    }
  }, [user]);

  const addWalletAddress = useCallback(async () => {
    if (user) {
      const currentAddresses = user.walletAddresses || [];
      if (currentAddresses.length < 5) {
        const newAddress = createWalletAddress(user.id);
        const newAddresses = [...currentAddresses, newAddress];
        await updateUser({ walletAddresses: newAddresses });
      }
    }
  }, [user, updateUser]);


  const value = { user, loading, login, signup, logout, updateUser, addTransaction, transferKtc, addWalletAddress };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
