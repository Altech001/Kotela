

'use client';

import { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Boost as BoostType, Powerup as PowerupType, GameSession, UserPowerup, UserBoost } from '@/lib/types';
import { getBoost, getPowerup } from '@/lib/actions';
import { analyzePrivacyRisks } from '@/ai/flows/privacy-risk-analysis';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, runTransaction, arrayUnion, serverTimestamp, collection, addDoc, query, where, getDocs, limit, writeBatch } from 'firebase/firestore';


export type GameStatus = "idle" | "playing" | "ended";

const DEFAULT_GAME_DURATION = 30; // 30 seconds
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
  const [baseGameDuration, setBaseGameDuration] = useState(DEFAULT_GAME_DURATION);
  
  // Fetch game config from Firestore
  useEffect(() => {
    const configRef = doc(db, 'config', 'gameConfig');
    const unsubscribe = onSnapshot(configRef, (doc) => {
      if (doc.exists()) {
        setBaseGameDuration(doc.data().baseGameDuration || DEFAULT_GAME_DURATION);
      }
    });
    return () => unsubscribe();
  }, []);
  
  // Game session listener from Firestore
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
        if (sessionData.status === 'playing' && Date.now() >= sessionData.expectedEndTime) {
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
  
  // Auto-clicker bot logic
  useEffect(() => {
    let autoClickerInterval: NodeJS.Timeout | undefined;
    const autoClickerBot = user?.boosts.find(b => b.botType === 'active_clicking' && b.active);

    if (autoClickerBot && autoClickerBot.effects?.autoClick) {
        const interval = autoClickerBot.effects.clickInterval || 2000;
        autoClickerInterval = setInterval(() => {
            if (gameStatus === 'idle') {
                startGame();
            } else if (gameStatus === 'ended') {
                resetGame();
            }
        }, interval);
    }

    return () => clearInterval(autoClickerInterval);
  }, [user, gameStatus]);


  // Main game loop (timer, score calculation, etc.)
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (gameStatus === 'playing' && session) {
      interval = setInterval(() => {
        const now = Date.now();
        let currentSession = { ...session }; // Work with a local copy

        if (now >= currentSession.expectedEndTime) {
          endGame(currentSession);
          return;
        }

        // --- Automatic Mining Logic ---
        let currentRate = BASE_MINING_RATE;

        // Apply permanent multiplier from power-ups
        const permMultiplierPowerup = user?.powerups.find(p => p.powerupId === 'perm-multiplier-1.5x');
        if (permMultiplierPowerup) currentRate *= 1.5;
        
        // Apply bot upgrade multiplier
        const botUpgradePowerup = user?.powerups.find(p => p.powerupId === 'bot-upgrade-1');
        if (botUpgradePowerup) currentRate *= (botUpgradePowerup.value || 1);

        // Apply active yield bots
        const activeYieldBots = user?.boosts.filter(b => b.botType === 'active_yield' && b.active);
        activeYieldBots?.forEach(bot => {
            currentRate += bot.effects?.ktcPerSecond || 0;
        });

        // Check for active boost/power-up and apply its effect
        if (currentSession.activeBoost && now < currentSession.activeBoost.endTime) {
            const boostType = currentSession.activeBoost.type;
            if (boostType === 'score_multiplier') {
                currentRate *= currentSession.activeBoost.value;
            }
        } else if (currentSession.activeBoost) {
            // Boost has expired, clear it from local state for immediate UI update
            currentSession.activeBoost = null;
        }

        // Check if time is frozen
        const isTimeFrozen = currentSession.activeBoost?.type === 'time_freeze' && now < currentSession.activeBoost.endTime;
        
        // Calculate score to add for this tick (1 second)
        // No score is added if time is frozen
        const scoreToAdd = isTimeFrozen ? 0 : currentRate;
        const newScore = (currentSession.score || 0) + scoreToAdd;
        
        // Update local state for immediate UI responsiveness
        setSession(s => s ? { ...s, score: newScore, activeBoost: currentSession.activeBoost } : null);

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, session, user]);

  // Sync local session state to Firestore periodically
  useEffect(() => {
      let syncInterval: NodeJS.Timeout | undefined;
      if (gameStatus === 'playing' && session && user) {
          syncInterval = setInterval(async () => {
              const sessionRef = doc(db, 'gameSessions', user.id);
              // Only write if the session still exists locally
              if(session) {
                // Use set with merge to avoid overwriting if a concurrent change happened
                await setDoc(sessionRef, session, { merge: true });
              }
          }, 2000); // Sync every 2 seconds
      }
      return () => clearInterval(syncInterval);
  }, [session, gameStatus, user]);


  const startGame = async (extraDuration = 0) => {
    if (!user || gameStatus !== 'idle') return;

    const totalDuration = baseGameDuration + extraDuration;
    const startTime = Date.now();
    const newSession: GameSession = {
      userId: user.id,
      score: 0,
      startTime: startTime,
      expectedEndTime: startTime + totalDuration * 1000,
      duration: totalDuration,
      status: 'playing',
      activeBoost: null,
    };
    
    // Set local state first for instant UI update
    setGameStatus('playing');
    setSession(newSession);

    // Then write to Firestore
    const sessionRef = doc(db, 'gameSessions', user.id);
    await setDoc(sessionRef, newSession);
  };

  const endGame = useCallback(async (finalSession: GameSession) => {
    if (!user || gameStatus === 'ended' || finalSession.status !== 'playing') return;

    setGameStatus('ended');

    // Update local state to show final score
    setSession(s => s ? {...s, status: 'ended'} : null);

    const sessionRef = doc(db, 'gameSessions', user.id);
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
      
      // Store daily mine score
      const today = new Date().toISOString().slice(0, 10);
      const dailyMinesRef = doc(db, 'users', user.id, 'dailyMines', today);
      await setDoc(dailyMinesRef, {
          scores: arrayUnion({ score: finalScore, timestamp: new Date().toISOString() })
      }, { merge: true });
    }

    const gameData = JSON.stringify({ finalScore: finalScore, endTime: new Date().toISOString() });
    try {
      const result = await analyzePrivacyRisks({ gameplayData: gameData });
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
  }, [gameStatus, user, startGame]);

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
    if (!user) return false;

    const isPowerup = 'maxQuantity' in item;
    const isBot = item.type === 'mining_bot';

    try {
        const userRef = doc(db, 'users', user.id);
        
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User does not exist!";
            
            const currentUser = userDoc.data() as any;
            if (currentUser.ktc < item.cost) throw "Insufficient KTC.";

            if (isPowerup) {
                // Permanent powerups are stored on the user document
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
                        quantity: 1,
                        value: powerupItem.value,
                    });
                }
                
                transaction.update(userRef, { powerups: newPowerups });
            
            } else if (isBot) {
                // Bots are a special boost type stored on the user doc
                const botItem = item as BoostType;
                const now = Date.now();
                const expiryTimestamp = botItem.durationHours ? now + botItem.durationHours * 60 * 60 * 1000 : null;

                const newBotInstance: UserBoost = {
                    instanceId: `bot-${user.id.slice(0,4)}-${now}`,
                    boostId: botItem.id,
                    name: botItem.name,
                    botType: botItem.botType,
                    effects: botItem.effects,
                    purchasedAt: new Date(now).toISOString(),
                    expiryTimestamp: expiryTimestamp,
                    active: true,
                };
                transaction.update(userRef, { boosts: arrayUnion(newBotInstance) });

            } else {
                // Consumable boosts are added to the userInventory collection
                const inventoryRef = collection(db, 'userInventory');
                const newItem = {
                    userId: user.id,
                    itemId: item.id,
                    itemType: 'boost',
                    name: item.name,
                    description: item.description,
                    purchasedAt: new Date().toISOString(),
                    type: item.type,
                };
                transaction.set(doc(inventoryRef), newItem);
            }
            
            // Deduct cost and add transaction record for all item types
            transaction.update(userRef, {
                ktc: currentUser.ktc - item.cost,
                transactions: arrayUnion({
                  id: `tx-purchase-${item.id}-${Date.now()}`,
                  type: 'purchase',
                  amount: item.cost,
                  timestamp: new Date().toISOString(),
                  description: `Purchased ${item.name}`,
                })
            });
        });
        
        return true;
    } catch (error) {
        console.error("Purchase failed:", error);
        return false;
    }
  }, [user]);

 const useItem = async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    const inventoryRef = collection(db, 'userInventory');
    const q = query(inventoryRef, where('userId', '==', user.id), where('itemId', '==', itemId), limit(1));
    
    try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            throw new Error("Item not available or out of stock.");
        }
        
        const itemDocToDelete = snapshot.docs[0];
        await deleteDoc(itemDocToDelete.ref);
        
        return true;
    } catch (error) {
        console.error("Failed to use item:", error);
        return false;
    }
 };
 
 const activateExtraTime = async (itemId: string) => {
    if (gameStatus !== 'idle' || !user) return;
    
    let itemInfo: BoostType | PowerupType | null = await getPowerup(itemId);
    if (!itemInfo) itemInfo = await getBoost(itemId);
    
    if (!itemInfo || (itemInfo.type !== 'extra_time' && itemInfo.id !== 'extraTime')) return;
    
    const consumed = await useItem(itemId);
    if(consumed) {
        await startGame(itemInfo.value);
    }
 }

 const activateBoost = async (itemId: string) => {
    if (gameStatus !== 'playing' || !user || !session) return;
    if (session.activeBoost && itemId !== 'scoreBomb') return;

    let itemInfo: BoostType | PowerupType | null = await getPowerup(itemId);
    if (!itemInfo) itemInfo = await getBoost(itemId);

    if (!itemInfo) {
      console.error("Item details not found");
      return;
    }
    
    const consumed = await useItem(itemId);
    if (!consumed) return;
    
    const now = Date.now();

    // Instant effect items
    if (itemInfo.type === 'scoreBomb' || itemInfo.id === 'scoreBomb') {
        const newScore = (session.score || 0) + itemInfo.value;
        setSession(s => s ? {...s, score: newScore} : null); // Update local state immediately
        return;
    }

    const activeBoostPayload = {
      id: itemInfo.id,
      name: itemInfo.name,
      type: itemInfo.type,
      value: itemInfo.value,
      endTime: 0,
    };

    let durationMs = 0;
    if (itemInfo.id === 'missile') durationMs = 3000;
    else if (itemInfo.id === 'rocket' || itemInfo.id === 'multiplier-2x' || itemInfo.id === 'multiplier-3x') durationMs = 5000;
    else if (itemInfo.id === 'frenzy') durationMs = 3000;
    else if (itemInfo.type === 'time_freeze' || itemInfo.id === 'freezeTime' || itemInfo.id === 'time-freeze-5') durationMs = itemInfo.value * 1000;
    else if (itemInfo.type === 'score_multiplier') durationMs = 5000; // Default for other multipliers

    if (durationMs > 0) {
        activeBoostPayload.endTime = now + durationMs;
    }

    if (itemInfo.type === 'time_freeze' || itemInfo.id === 'freezeTime' || itemInfo.id === 'time-freeze-5') {
        setSession(s => {
            if (!s) return null;
            const newExpectedEndTime = s.expectedEndTime + (itemInfo.value * 1000);
            return { ...s, activeBoost: activeBoostPayload, expectedEndTime: newExpectedEndTime };
        });
    } else {
        setSession(s => s ? {...s, activeBoost: activeBoostPayload} : null);
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
