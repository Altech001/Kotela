
'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import type { User, Transaction, Boost, Powerup, Wallet, UserBoost } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch, arrayUnion, runTransaction, onSnapshot } from 'firebase/firestore';
import { storeItems as localStoreItems } from '@/lib/data';
import { powerupItems as localPowerupItems } from '@/lib/powerups-data';
import { addNotification } from '@/lib/actions';


const createWalletAddress = (network: string, uid: string) => `KTC_${network.slice(0,3).toUpperCase()}_${uid.slice(0, 4)}${Date.now().toString(36).slice(-4)}`;

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
  wallets: [
    {
        id: `wallet-${firebaseUser.uid.slice(0, 8)}-main`,
        network: 'Main',
        address: createWalletAddress('Main', firebaseUser.uid),
        status: 'active',
    }
  ],
  isKycVerified: false,
  isPhoneVerified: false,
  ...extraData,
});

async function initializeCollections() {
    const boostsRef = collection(db, 'boosts');
    const powerupsRef = collection(db, 'powerups');
    const configRef = doc(db, 'config', 'gameConfig');
    const batch = writeBatch(db);

    // This will now overwrite existing data, ensuring the DB is in sync with local files
    localStoreItems.forEach((item) => {
        const docRef = doc(boostsRef, item.id);
        batch.set(docRef, item);
    });

    localPowerupItems.forEach((item) => {
        const docRef = doc(powerupsRef, item.id);
        batch.set(docRef, item);
    });

    // Initialize game config if it doesn't exist
    const configDoc = await getDoc(configRef);
    if (!configDoc.exists()) {
      batch.set(configRef, { baseGameDuration: 30 });
    }


    await batch.commit();
    console.log("Initialized/updated 'boosts', 'powerups', and 'gameConfig' collections from local data.");
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeCollections();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setUser(doc.data() as User);
            } else {
                // This case should ideally not happen after signup logic is correct
                const newUser = createUserObject(firebaseUser);
                setDoc(userDocRef, newUser).then(() => setUser(newUser));
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            setUser(null);
            setLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user
    } finally {
      // Don't setLoading(false) here, let the listener do it
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
          
          await addNotification(newUser.id, { title: 'Referral Bonus!', description: `You received ${NEW_USER_BONUS} KTC for using a referral code.` });


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
          
          await addNotification(directReferrerDoc.id, { title: 'Referral Bonus!', description: `You received ${TIER_1_BONUS} KTC for referring ${newUser.name}.` });


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
               
               await addNotification(indirectReferrerDoc.id, { title: 'Tier 2 Referral Bonus!', description: `You received ${TIER_2_BONUS} KTC from a tier 2 referral.` });
            }
          }
        }
      }
      
      const newUserRef = doc(db, 'users', firebaseUser.uid)
      batch.set(newUserRef, newUser);

      await batch.commit();
      
      // onAuthStateChanged will set the user, no need to call setUser here.
    } finally {
      // Don't setLoading(false) here, let the listener do it
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
      // No need to call setUser, onSnapshot will handle it.
    }
  }, [user]);

  const sendVerificationOtp = useCallback(async (phoneNumber: string, name: string): Promise<string> => {
    if (!user) throw new Error("User not found.");
    
    // In a real app, you would use a service like Firebase Auth to send a real OTP.
    // For this simulation, we'll generate a code and save its hash to the user doc.
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real app, you would use a secure, one-way hashing algorithm (e.g., bcrypt).
    // For this simulation, a simple "hash" is sufficient.
    const otpHash = `simulated-hash-of-${otp}`;
    
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // OTP is valid for 10 minutes

    await updateUser({
      otpHash,
      otpExpiry: expiry.toISOString(),
      phoneNumber: phoneNumber, // Temporarily store the number being verified
      phoneHolderName: name,
    });
    
    // We return the actual OTP here only because this is a simulation.
    // In a real app, the OTP would be sent to the user's device and not returned by the function.
    return otp;
  }, [user, updateUser]);

  const verifyPhoneNumber = useCallback(async (otp: string) => {
    if (!user || !user.otpHash || !user.otpExpiry) {
        throw new Error("No pending verification found.");
    }
    
    if (new Date() > new Date(user.otpExpiry)) {
        await updateUser({ otpHash: undefined, otpExpiry: undefined });
        throw new Error("OTP has expired. Please request a new one.");
    }

    const expectedHash = `simulated-hash-of-${otp}`;
    
    if (user.otpHash === expectedHash) {
        await updateUser({
            isPhoneVerified: true,
            // phoneNumber and phoneHolderName are already set from sendVerificationOtp
            otpHash: undefined,
            otpExpiry: undefined,
        });
    } else {
        throw new Error("Invalid OTP. Please try again.");
    }
  }, [user, updateUser]);

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
      // No need to call setUser, onSnapshot will handle it.
    }
  }, [user]);

  const transferKtc = useCallback(async (recipientIdentifier: string, amount: number) => {
    if (!user) throw new Error("You must be logged in to transfer KTC.");
    if (recipientIdentifier === user.referralCode || (user.wallets || []).some(w => w.address === recipientIdentifier)) {
      throw new Error("You cannot send KTC to yourself.");
    }

    try {
        await runTransaction(db, async (transaction) => {
            const usersRef = collection(db, 'users');
            
            const allUsersSnapshot = await getDocs(usersRef);
            let recipientDoc: any = null;
            let recipientData: User | null = null;
            
            for(const doc of allUsersSnapshot.docs) {
                const u = doc.data() as User;
                if(u.referralCode === recipientIdentifier || (u.wallets && u.wallets.some(w => w.address === recipientIdentifier))) {
                    recipientDoc = doc;
                    recipientData = u;
                    break;
                }
            }


            if (!recipientDoc || !recipientData) {
                throw new Error("Recipient not found.");
            }
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
        });
    } catch (error) {
        console.error("KTC Transfer failed: ", error);
        throw error;
    }
  }, [user]);

 const addWalletAddress = useCallback(async (network: string) => {
    if (user) {
      const currentWallets = user.wallets || [];
      if (currentWallets.length >= 5) {
        throw new Error("Wallet limit reached. You can only have a maximum of 5 wallets.");
      }
      const newWallet: Wallet = {
        id: `wallet-${user.id.slice(0,8)}-${network.toLowerCase()}-${Date.now().toString(36).slice(-4)}`,
        network: network,
        address: createWalletAddress(network, user.id),
        status: 'active'
      };
      await updateUser({ wallets: arrayUnion(newWallet) as any });
    }
  }, [user, updateUser]);

  const deleteWalletAddress = useCallback(async (walletId: string) => {
    if (user) {
        const newWallets = (user.wallets || []).filter(w => w.id !== walletId);
        await updateUser({ wallets: newWallets });
    }
  }, [user, updateUser]);

  const toggleWalletStatus = useCallback(async (walletId: string) => {
    if (user) {
        const newWallets = (user.wallets || []).map(w => {
            if (w.id === walletId) {
                return { ...w, status: w.status === 'active' ? 'inactive' : 'active' };
            }
            return w;
        });
        await updateUser({ wallets: newWallets });
    }
  }, [user, updateUser]);

  const toggleBotStatus = useCallback(async (userId: string, botInstanceId: string) => {
    const userRef = doc(db, 'users', userId);
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User not found");

      const boosts = userDoc.data().boosts as UserBoost[];
      const botIndex = boosts.findIndex(b => b.instanceId === botInstanceId);
      
      if (botIndex === -1) throw new Error("Bot not found");

      boosts[botIndex].active = !boosts[botIndex].active;
      transaction.update(userRef, { boosts });
    });
  }, []);

  const deleteBot = useCallback(async (userId: string, botInstanceId: string) => {
    const userRef = doc(db, 'users', userId);
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User not found");

      const boosts = userDoc.data().boosts as UserBoost[];
      const updatedBoosts = boosts.filter(b => b.instanceId !== botInstanceId);

      transaction.update(userRef, { boosts: updatedBoosts });
    });
  }, []);


  const value = { user, loading, login, signup, logout, updateUser, sendVerificationOtp, verifyPhoneNumber, addTransaction, transferKtc, addWalletAddress, deleteWalletAddress, toggleWalletStatus, toggleBotStatus, deleteBot };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

    