"use client";

import { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { storeItems } from '@/lib/data';
import type { Boost as BoostType } from '@/lib/types';
import { runPrivacyAnalysis } from '@/lib/actions';

export type GameStatus = "idle" | "playing" | "ended";
export type ActiveBoostEffect = 'scoreMultiplier' | 'timeFreeze' | 'frenzy' | null;


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
  
  // New properties for the modern game engine
  timeLeft: number;
  gameState: GameStatus;
  activeBoost: 'rocket' | 'missile' | null;
  activeEffect: ActiveBoostEffect;
  boostTimeLeft: number;
  scoreIncrement: number;
  activateEffectBoost: (boostType: 'freezeTime' | 'frenzy') => void;
  activateInstantBoost: (boostType: 'scoreBomb') => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, updateUser, addTransaction } = useAuth();
  
  const [score, setScore] = useState(0);
  const [gameDuration, setGameDuration] = useState(BASE_GAME_DURATION);
  const [timer, setTimer] = useState(gameDuration);
  const [gameState, setGameState] = useState<GameStatus>('idle');
  
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [privacyWarning, setPrivacyWarning] = useState<string | null>(null);

  const [activeBoosts, setActiveBoosts] = useState<Record<string, ActiveBoost>>({});
  const [timeBoostUsed, setTimeBoostUsed] = useState(false);
  
  const [activeBoost, setActiveBoost] = useState<'rocket' | 'missile' | null>(null);
  const [activeEffect, setActiveEffect] = useState<ActiveBoostEffect>(null);
  const [boostTimeLeft, setBoostTimeLeft] = useState(0);


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
  
  const scoreIncrement = useMemo(() => {
    let increment = 1;
    if (activeBoost === 'rocket') increment = 2;
    if (activeBoost === 'missile') increment = 3;
    if (activeEffect === 'frenzy') increment *= 10;
    return increment;
  }, [activeBoost, activeEffect]);

  const handleTap = useCallback(() => {
    if (gameState === "idle") {
      setGameState("playing");
    }
     if (gameState !== 'playing') return;
    const multiplier = activeBoosts['score_multiplier']?.value || 1;
    setScore((prev) => prev + 1 * multiplier);
  }, [gameState, activeBoosts]);

  const resetGame = useCallback(() => {
    setScore(0);
    setGameDuration(BASE_GAME_DURATION);
    setTimer(BASE_GAME_DURATION);
    setGameState("idle");
    setPrivacyWarning(null);
    setActiveBoosts({});
    setActiveBoost(null);
    setActiveEffect(null);
    setBoostTimeLeft(0);
    setTimeBoostUsed(false);
  }, []);

  const endGame = useCallback(async () => {
    if (gameState !== 'playing') return;
    setGameState("ended");
    
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
  }, [gameState, score, user, updateUser, addTransaction]);

  // Main game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing' && timer > 0) {
       const isFrozen = activeEffect === 'timeFreeze';
       if (!isFrozen) {
           interval = setInterval(() => {
                setTimer((prev) => Math.max(0, prev - 1));
            }, 1000);
       }
    } else if (gameState === 'playing' && timer === 0) {
      endGame();
    }
    return () => clearInterval(interval);
  }, [timer, gameState, endGame, activeEffect]);

  // Boosts timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing' && activeEffect && boostTimeLeft > 0) {
        interval = setInterval(() => {
            setBoostTimeLeft(prev => prev - 1);
        }, 1000);
    } else if (activeEffect && boostTimeLeft <= 0) {
      setActiveBoost(null);
      setActiveEffect(null);
    }
    return () => clearInterval(interval);
  }, [gameState, activeEffect, boostTimeLeft]);
  
  // Auto-tapping for mining bot & frenzy
  useEffect(() => {
    let autoTapInterval: NodeJS.Timeout;
     const isFrenzy = activeEffect === 'frenzy';

    if (gameState === 'playing' && (hasMiningBot || isFrenzy)) {
      autoTapInterval = setInterval(() => {
        handleTap();
      }, isFrenzy ? 100 : 1000); 
    }
    return () => clearInterval(autoTapInterval);
  }, [gameState, hasMiningBot, activeEffect, handleTap]);

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
  
  const activateBoostModern = (boostType: 'rocket' | 'missile') => {
    const boostId = storeItems.find(i => i.type === 'score_multiplier' && (i.name.toLowerCase().includes(boostType)))?.id
    if (gameState === 'playing' && !activeEffect && boostId && useBoost(boostId)) {
      setActiveBoost(boostType);
      setActiveEffect('scoreMultiplier');
      setBoostTimeLeft(boostType === 'rocket' ? 5 : 3);
    }
  }

  const activateEffectBoost = (boostType: 'freezeTime' | 'frenzy') => {
    const boostId = storeItems.find(i => i.type === (boostType === 'freezeTime' ? 'time_freeze' : 'score_multiplier'))?.id
     if (gameState === 'playing' && !activeEffect && boostId && useBoost(boostId)) {
      setActiveEffect(boostType);
      setBoostTimeLeft(boostType === 'freezeTime' ? 5 : 3);
    }
  };
  
  const activateInstantBoost = (boostType: 'scoreBomb') => {
     const boostId = storeItems.find(i => i.name.toLowerCase().includes('bomb'))?.id
     if (gameState === 'playing' && boostId && useBoost(boostId)) {
      if (boostType === 'scoreBomb') {
        setScore(s => s + 10);
      }
    }
  };

  const activateTimeBoost = (boostId: string) => {
    if (gameState === 'idle' && !timeBoostUsed && useBoost(boostId)) {
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

// Legacy activateBoost, needs to be kept for old game engine logic if it's still used somewhere
 const activateBoost = (boostId: string) => {
    if (gameState === 'playing' && useBoost(boostId)) {
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


  const value: GameContextType = {
    score,
    timer,
    gameStatus: gameState,
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
    // new props
    timeLeft: timer,
    gameState,
    activeBoost,
    activeEffect,
    boostTimeLeft,
    scoreIncrement,
    activateEffectBoost,
    activateInstantBoost,
    activateBoost: activateBoostModern,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
