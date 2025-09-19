"use client";

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { storeItems } from '@/lib/data';
import type { Boost as BoostType } from '@/lib/types';
import { runPrivacyAnalysis } from '@/lib/actions';

export type GameStatus = "idle" | "playing" | "ended";

const BASE_GAME_DURATION = 30;

interface ActiveBoost {
  id: string;
  type: BoostType['type'];
  value: number;
  timeLeft: number;
}

interface GameContextType {
  score: number;
  timer: number;
  gameStatus: GameStatus;
  isStoreOpen: boolean;
  isModalOpen: boolean;
  privacyWarning: string | null;
  activeBoosts: Record<string, ActiveBoost>;
  inventory: Record<string, number>;
  gameDuration: number;
  timeBoostUsed: boolean;
  
  handleTap: () => void;
  resetGame: () => void;
  buyBoost: (boost: BoostType) => boolean;
  activateBoost: (boostId: string) => void;
  activateTimeBoost: (boostId: string) => void;
  activateTimeFreeze: (boostId: string) => void;
  activateFrenzy: (boostId: string) => void;

  setIsStoreOpen: (isOpen: boolean) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, updateUser, addTransaction } = useAuth();
  
  const [score, setScore] = useState(0);
  const [gameDuration, setGameDuration] = useState(BASE_GAME_DURATION);
  const [timer, setTimer] = useState(gameDuration);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [privacyWarning, setPrivacyWarning] = useState<string | null>(null);

  const [activeBoosts, setActiveBoosts] = useState<Record<string, ActiveBoost>>({});
  const [timeBoostUsed, setTimeBoostUsed] = useState(false);
  
  const hasMiningBot = user?.boosts.some((b) => b.boostId === 'bot-1' && b.quantity > 0);

  const inventory = useMemo(() => {
    return user?.boosts.reduce((acc, boost) => {
      const item = storeItems.find(item => item.id === boost.boostId);
      if(item) {
          acc[item.type] = (acc[item.type] || 0) + boost.quantity;
      }
      return acc;
    }, {} as Record<string, number>) || {};
  }, [user?.boosts]);

  const handleTap = useCallback(() => {
    if (gameStatus === "idle") {
      setGameStatus("playing");
    }
     if (gameStatus !== 'playing') return;
    const multiplier = activeBoosts['score_multiplier']?.value || 1;
    setScore((prev) => prev + 1 * multiplier);
  }, [gameStatus, activeBoosts]);

  const resetGame = useCallback(() => {
    setScore(0);
    setGameDuration(BASE_GAME_DURATION);
    setTimer(BASE_GAME_DURATION);
    setGameStatus("idle");
    setPrivacyWarning(null);
    setActiveBoosts({});
    setTimeBoostUsed(false);
  }, []);

  const endGame = useCallback(async () => {
    if (gameStatus !== 'playing') return;
    setGameStatus("ended");
    
    if (user && score > 0) {
      const newKtc = user.ktc + score;
      updateUser({ ktc: newKtc });
      addTransaction({
        type: 'deposit',
        amount: score,
        description: 'Gameplay earnings',
      });
    }

    const gameData = JSON.stringify({ finalScore: score, endTime: new Date().toISOString() });
    try {
      const result = await runPrivacyAnalysis(gameData);
      if (result.analysisResult.includes("risk")) {
        setPrivacyWarning(result.analysisResult + " " + result.recommendations);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Privacy analysis failed:", error);
    }
  }, [gameStatus, score, user, updateUser, addTransaction]);

  // Main game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStatus === 'playing' && timer > 0) {
       const isFrozen = activeBoosts['time_freeze'];
       if (!isFrozen) {
           interval = setInterval(() => {
                setTimer((prev) => Math.max(0, prev - 1));
            }, 1000);
       }
    } else if (gameStatus === 'playing' && timer === 0) {
      endGame();
    }
    return () => clearInterval(interval);
  }, [timer, gameStatus, endGame, activeBoosts]);

  // Boosts timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStatus === 'playing' && Object.keys(activeBoosts).length > 0) {
        interval = setInterval(() => {
            setActiveBoosts(prevBoosts => {
                const newBoosts = {...prevBoosts};
                let changed = false;
                for (const key in newBoosts) {
                    if (newBoosts[key].timeLeft > 1) {
                        newBoosts[key].timeLeft -= 1;
                        changed = true;
                    } else {
                        delete newBoosts[key];
                        changed = true;
                    }
                }
                return changed ? newBoosts : prevBoosts;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, activeBoosts]);
  
  // Auto-tapping for mining bot & frenzy
  useEffect(() => {
    let autoTapInterval: NodeJS.Timeout;
     const isFrenzy = activeBoosts['frenzy'];

    if (gameStatus === 'playing' && (hasMiningBot || isFrenzy)) {
      autoTapInterval = setInterval(() => {
        handleTap();
      }, isFrenzy ? 100 : 1000); 
    }
    return () => clearInterval(autoTapInterval);
  }, [gameStatus, hasMiningBot, activeBoosts, handleTap]);

  const useBoost = (boostId: string): boolean => {
    if (!user) return false;
    const boostIndex = user.boosts.findIndex(b => b.boostId === boostId && b.quantity > 0);
    if (boostIndex > -1) {
      const newBoosts = [...user.boosts];
      newBoosts[boostIndex].quantity -= 1;
      if (newBoosts[boostIndex].quantity === 0) {
          newBoosts.splice(boostIndex, 1);
      }
      updateUser({ boosts: newBoosts });
      return true;
    }
    return false;
  };
  
  const activateBoost = (boostId: string) => {
    if (gameStatus === 'playing' && useBoost(boostId)) {
        const boostInfo = storeItems.find(b => b.id === boostId);
        if (boostInfo) {
            setActiveBoosts(prev => ({
                ...prev,
                [boostInfo.type]: {
                    id: boostInfo.id,
                    type: boostInfo.type,
                    value: boostInfo.value,
                    timeLeft: 5, // All boosts last 5 seconds for now
                }
            }));
        }
    }
  };

  const activateTimeBoost = (boostId: string) => {
    if (gameStatus === 'idle' && !timeBoostUsed && useBoost(boostId)) {
      const boostInfo = storeItems.find(b => b.id === boostId);
       if (boostInfo) {
          const newDuration = BASE_GAME_DURATION + boostInfo.value;
          setGameDuration(newDuration);
          setTimer(newDuration);
          setTimeBoostUsed(true);
       }
    }
  };
  
  const activateTimeFreeze = (boostId: string) => {
     activateBoost(boostId); // Uses the same logic
  }

  const activateFrenzy = (boostId: string) => {
      activateBoost(boostId); // Uses the same logic
  }

  const buyBoost = useCallback((boost: BoostType): boolean => {
    if (user && user.ktc >= boost.cost) {
        const existingBoostIndex = user.boosts.findIndex(b => b.boostId === boost.id);
        let newBoosts = [...(user.boosts || [])];

        if (existingBoostIndex > -1) {
            newBoosts[existingBoostIndex].quantity += 1;
        } else {
            newBoosts.push({ boostId: boost.id, quantity: 1 });
        }
        
        updateUser({
            ktc: user.ktc - boost.cost,
            boosts: newBoosts,
        });

        addTransaction({
            type: 'purchase',
            amount: boost.cost,
            description: `Purchased ${boost.name}`,
        });

        return true;
    }
    return false;
}, [user, updateUser, addTransaction]);


  const value = {
    score,
    timer,
    gameStatus,
    isStoreOpen,
    isModalOpen,
    privacyWarning,
    activeBoosts,
    inventory,
    gameDuration,
    timeBoostUsed,
    handleTap,
    resetGame,
    buyBoost,
    activateBoost,
    activateTimeBoost,
    activateTimeFreeze,
    activateFrenzy,
    setIsStoreOpen,
    setIsModalOpen,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
