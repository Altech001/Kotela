"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { Boost } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

export type GameStatus = "idle" | "playing" | "ended";
export type BoostType = "score_multiplier" | "extra_time" | "time_freeze" | "mining_bot";

interface GameContextType {
  score: number;
  timer: number;
  gameStatus: GameStatus;
  startGame: () => void;
  tap: () => void;
  endGame: () => void;
  buyBoost: (boost: Boost) => boolean;
  activeBoosts: any; 
  activateBoost: (boostId: string) => void;
}

const GAME_DURATION = 30;

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, updateUser, addTransaction } = useAuth();
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [activeBoosts, setActiveBoosts] = useState<any>({});
  
  const hasMiningBot = user?.boosts.some((b) => b.boostId === 'bot-1' && b.quantity > 0);

  const startGame = useCallback(() => {
    setScore(0);
    setTimer(GAME_DURATION);
    setGameStatus('playing');
    setActiveBoosts({});
  }, []);

  const tap = useCallback(() => {
    if (gameStatus !== 'playing') return;
    const multiplier = activeBoosts['score_multiplier']?.value || 1;
    setScore((prev) => prev + 1 * multiplier);
  }, [gameStatus, activeBoosts]);

  const endGame = useCallback(() => {
    if (gameStatus !== 'playing' && user && score > 0) {
        setGameStatus('ended');
        const newKtc = user.ktc + score;
        updateUser({ ktc: newKtc });
        addTransaction({
            type: 'deposit',
            amount: score,
            description: 'Gameplay earnings',
        });
    } else if (gameStatus === 'playing') {
        setGameStatus('idle');
    }
  }, [gameStatus, score, user, updateUser, addTransaction]);

  // Auto-tapping for mining bot
  useEffect(() => {
    let autoTapInterval: NodeJS.Timeout;
    if (gameStatus === 'playing' && hasMiningBot) {
      autoTapInterval = setInterval(() => {
        tap();
      }, 1000); // Taps once per second
    }
    return () => clearInterval(autoTapInterval);
  }, [gameStatus, hasMiningBot, tap]);


  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStatus === 'playing' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (gameStatus === 'playing' && timer === 0) {
      endGame();
    }
    return () => clearInterval(interval);
  }, [timer, gameStatus, endGame]);

  const buyBoost = useCallback((boost: Boost): boolean => {
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

  const activateBoost = useCallback((boostId: string) => {
    // In a real app, this would be more complex
    // For now, just a placeholder
    console.log(`Boost ${boostId} activated`);
  }, []);

  const value = {
    score,
    timer,
    gameStatus,
    startGame,
    tap,
    endGame,
    buyBoost,
    activeBoosts,
    activateBoost,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}