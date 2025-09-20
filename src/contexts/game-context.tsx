
"use client";

import { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Boost as BoostType, Powerup as PowerupType, GameSession, UserPowerup, UserBoost } from '@/lib/types';
import { runPrivacyAnalysis, getBoost, getPowerup } from '@/lib/actions';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, runTransaction, arrayUnion } from 'firebase/firestore';


export type GameStatus = "idle" | "playing" | "ended";

const BASE_GAME_DURATION = 30 * 1000; // 30 seconds in ms
const BASE_MINING_RATE = 0.5; // KTC per second

type StoreItem = BoostType | PowerupType;

export interface GameContextType {
  session: GameSession | null;
  gameStatus: GameStatus;
  isStoreOpen: boolean;
  isModalOpen: boolean;
  privacyWarning: string | null;
  
  handleTap: () => void;
  resetGame: () => Promise<void>;
  buyItem: (item: StoreItem) => Promise<boolean>;
  activateBoost: (itemId: string) => Promise<void>;
  activateExtraTime: (itemId: string) => Promise<void>;

  setIsStoreOpen: (isOpen: boolean) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, updateUser, addTransaction } = useAuth();
  
  const [session, setSession] = useState<GameSession | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [privacyWarning, setPrivacyWarning] = useState<string | null>(null);
  
  // Game session listener
  useEffect(() => {
    if (!user) {
      setSession(null);
      setGameStatus('idle');
      return;
    }

    const sessionRef = doc(db, 'gameSessions', user.id);
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const sessionData = doc.data() as GameSession;
        // Check if the game has ended based on expectedEndTime
        if (sessionData.status === 'playing' && Date.now() >= sessionData.expectedEndTime) {
           // Call endGame with the session data from the snapshot
           endGame(sessionData);
        } else {
          setSession(sessionData);
          setGameStatus(sessionData.status);
        }
      } else {
        setSession(null);
        setGameStatus('idle');
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Game timer & automatic mining effect
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (gameStatus === 'playing' && session) {
      const tick = async () => {
        const now = Date.now();
        let currentSession = session;

        // Fetch latest session data to avoid race conditions, especially for boost activations
        if(user) {
            const sessionRef = doc(db, 'gameSessions', user.id);
            const docSnap = await getDoc(sessionRef);
            if(docSnap.exists()) {
                currentSession = docSnap.data() as GameSession;
            } else {
                return; // Session ended elsewhere
            }
        }
        
        if (now >= currentSession.expectedEndTime) {
          endGame(currentSession);
          return;
        }

        // Automatic Mining Logic
        let currentRate = BASE_MINING_RATE;

        // Permanent Multiplier
        const permMultiplierPowerup = user?.powerups.find(p => p.powerupId === 'perm-multiplier-1.5x');
        if (permMultiplierPowerup) currentRate *= 1.5;

        // Active Boost/Powerup Multiplier
        if (currentSession.activeBoost && now < currentSession.activeBoost.endTime) {
          if (currentSession.activeBoost.type === 'score_multiplier' || currentSession.activeBoost.type === 'frenzy') {
            currentRate *= currentSession.activeBoost.value;
          }
        } else if (currentSession.activeBoost) {
           // Boost has expired, clear it
           if(user){
             const sessionRef = doc(db, 'gameSessions', user.id);
             await updateDoc(sessionRef, { activeBoost: null });
           }
        }

        // Time freeze check
        const isTimeFrozen = currentSession.activeBoost?.type === 'time_freeze' && now < currentSession.activeBoost.endTime;

        const scoreToAdd = isTimeFrozen ? 0 : currentRate * 1; // Add score per second, unless time is frozen

        const newScore = (currentSession.score || 0) + scoreToAdd;
        
        if (user) {
            const sessionRef = doc(db, 'gameSessions', user.id);
            await updateDoc(sessionRef, { score: newScore });
        }
        
        // Force a re-render to update timers on the UI.
        // We read from the local `currentSession` to make the UI feel instant.
        setSession(s => s ? {...currentSession, score: newScore} : null);
      };
      
      interval = setInterval(tick, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, session, user]);


  const startGame = async (extraDuration = 0) => {
    if (!user || gameStatus !== 'idle') return;

    const startTime = Date.now();
    const totalDuration = BASE_GAME_DURATION + (extraDuration * 1000);
    const newSession: GameSession = {
      userId: user.id,
      score: 0,
      startTime: startTime,
      expectedEndTime: startTime + totalDuration,
      duration: totalDuration / 1000,
      status: 'playing',
      activeBoost: null,
    };

    const sessionRef = doc(db, 'gameSessions', user.id);
    await setDoc(sessionRef, newSession);
  };

  const endGame = useCallback(async (finalSession: GameSession) => {
    if (!user || finalSession.status !== 'playing') return;

    // Use a state to track that the game is ending to prevent race conditions
    if (gameStatus === 'ended') return; 

    setGameStatus('ended');
    setSession(s => s ? {...s, status: 'ended'} : null);

    const sessionRef = doc(db, 'gameSessions', user.id);
    // Don't delete immediately, let the UI show final score
    await updateDoc(sessionRef, { status: 'ended' });

    const finalScore = finalSession.score;
    if (finalScore > 0) {
      const newKtc = user.ktc + finalScore;
      await updateUser({ ktc: newKtc });
      await addTransaction({
        type: 'deposit',
        amount: finalScore,
        description: 'Gameplay earnings',
      });
    }

    const gameData = JSON.stringify({ finalScore: finalScore, endTime: new Date().toISOString() });
    try {
      const result = await runPrivacyAnalysis(gameData);
      if (result.analysisResult.toLowerCase().includes("risk")) {
        setPrivacyWarning(result.analysisResult);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Privacy analysis failed:", error);
    }
  }, [user, updateUser, addTransaction, gameStatus]);


  const handleTap = useCallback(async () => {
    if (gameStatus === 'idle') {
      await startGame();
    }
  }, [gameStatus, user]);

  const resetGame = async () => {
    if(!user) return;
    const sessionRef = doc(db, 'gameSessions', user.id);
    await deleteDoc(sessionRef).catch(() => {}); // delete doc and ignore if not found
    setSession(null);
    setGameStatus("idle");
    setPrivacyWarning(null);
    setIsModalOpen(false);
  };

  const buyItem = useCallback(async (item: StoreItem): Promise<boolean> => {
    if (!user || user.ktc < item.cost) return false;

    const isPowerup = 'maxQuantity' in item;

    try {
        const userRef = doc(db, 'users', user.id);
        
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User does not exist!";
            
            const currentUser = userDoc.data() as any;
            if (currentUser.ktc < item.cost) throw "Insufficient KTC.";

            if (isPowerup) {
                const powerupItem = item as PowerupType;
                const newPowerups: UserPowerup[] = [...(currentUser.powerups || [])];
                const existingPowerupIndex = newPowerups.findIndex(p => p.powerupId === powerupItem.id);

                if (existingPowerupIndex > -1) {
                    const existingPowerup = newPowerups[existingPowerupIndex];
                     if ((existingPowerup.quantity || 0) >= powerupItem.maxQuantity) {
                         throw `Max quantity of ${powerupItem.name} reached.`;
                    }
                    newPowerups[existingPowerupIndex].quantity = (existingPowerup.quantity || 0) + 1;
                } else {
                    newPowerups.push({
                        powerupId: powerupItem.id,
                        purchasedAt: new Date().toISOString(),
                        quantity: 1
                    });
                }
                
                transaction.update(userRef, {
                    ktc: currentUser.ktc - item.cost,
                    powerups: newPowerups,
                });

            } else { // It's a boost
                const newBoosts: UserBoost[] = [...(currentUser.boosts || [])];
                const existingBoostIndex = newBoosts.findIndex(b => b.boostId === item.id);

                if (existingBoostIndex > -1) {
                    newBoosts[existingBoostIndex].quantity += 1;
                } else {
                    newBoosts.push({ boostId: item.id, quantity: 1 });
                }
                transaction.update(userRef, {
                    ktc: currentUser.ktc - item.cost,
                    boosts: newBoosts,
                });
            }
        });
        
        await addTransaction({
            type: 'purchase',
            amount: item.cost,
            description: `Purchased ${item.name}`,
        });

        // AuthProvider's onSnapshot will handle the user state update, triggering re-renders
        return true;
    } catch (error) {
        console.error("Purchase failed:", error);
        return false;
    }
  }, [user, addTransaction]);

 const useItem = async (itemId: string) => {
    if (!user) return false;
    const userRef = doc(db, 'users', user.id);
    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User does not exist.";
            const currentUser = userDoc.data() as any;

            const boostIndex = currentUser.boosts.findIndex((b: UserBoost) => b.boostId === itemId && b.quantity > 0);
            if (boostIndex > -1) {
                const newBoosts = [...currentUser.boosts];
                newBoosts[boostIndex].quantity -= 1;
                const finalBoosts = newBoosts.filter(b => b.quantity > 0);
                transaction.update(userRef, { boosts: finalBoosts });
            } else {
                 const powerupIndex = currentUser.powerups.findIndex((p: UserPowerup) => p.powerupId === itemId && (p.quantity || 0) > 0);
                if (powerupIndex > -1) {
                    const newPowerups = [...currentUser.powerups];
                    newPowerups[powerupIndex].quantity = (newPowerups[powerupIndex].quantity || 1) - 1;
                    const finalPowerups = newPowerups.filter(p => p.quantity > 0);
                    transaction.update(userRef, { powerups: finalPowerups });
                } else {
                    throw "Item not available or out of stock.";
                }
            }
        });
        return true;
    } catch (error) {
        console.error("Failed to use item:", error);
        return false;
    }
 };
 
 const activateExtraTime = async (itemId: string) => {
    if (gameStatus !== 'idle' || !user) return;
    
    let itemInfo: BoostType | PowerupType | null = await getBoost(itemId);
    if (!itemInfo) itemInfo = await getPowerup(itemId);
    
    if (!itemInfo || itemInfo.type !== 'extra_time') return;
    
    const consumed = await useItem(itemId);
    if(consumed) {
        await startGame(itemInfo.value);
    }
 }

 const activateBoost = async (itemId: string) => {
    if (gameStatus !== 'playing' || !user || !session) return;
    if (session.activeBoost && itemId !== 'scoreBomb') return;

    let itemInfo: BoostType | PowerupType | null = await getBoost(itemId);
    if (!itemInfo) itemInfo = await getPowerup(itemId);

    if (!itemInfo) {
      console.error("Item details not found");
      return;
    }
    
    const consumed = await useItem(itemId);
    if (!consumed) return;
    
    const sessionRef = doc(db, 'gameSessions', user.id);
    const now = Date.now();

    const activeBoostPayload = {
      id: itemInfo.id,
      name: itemInfo.name,
      type: itemInfo.type,
      value: itemInfo.value,
      endTime: 0, 
    };

    if (itemInfo.id === 'scoreBomb') {
        const newScore = (session.score || 0) + itemInfo.value;
        await updateDoc(sessionRef, { score: newScore });
        return; // instant effect, no activeBoost needed
    }

    if (itemInfo.type === 'score_multiplier' || itemInfo.type === 'frenzy') {
        const duration = itemInfo.id === 'missile' ? 3000 : 5000;
        activeBoostPayload.endTime = now + duration;
        await updateDoc(sessionRef, { activeBoost: activeBoostPayload });

    } else if (itemInfo.type === 'time_freeze') {
        activeBoostPayload.endTime = now + (itemInfo.value * 1000);
        // We need to read the current session to safely update the end time
        const currentSessionDoc = await getDoc(sessionRef);
        if (currentSessionDoc.exists()) {
          const currentSessionData = currentSessionDoc.data() as GameSession;
          const newExpectedEndTime = currentSessionData.expectedEndTime + (itemInfo.value * 1000);
          await updateDoc(sessionRef, { 
              activeBoost: activeBoostPayload,
              expectedEndTime: newExpectedEndTime
          });
        }
    }
 };


  const value: GameContextType = {
    session,
    gameStatus,
    isStoreOpen,
    isModalOpen,
    privacyWarning,
    handleTap,
    resetGame,
    buyItem,
    activateBoost,
    activateExtraTime,
    setIsStoreOpen,
    setIsModalOpen,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
