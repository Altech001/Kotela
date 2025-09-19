'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { GameContext, GameStatus } from '@/contexts/game-context';
import type { Boost } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

const GAME_DURATION = 30;

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { user, updateUser } = useAuth();
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [activeBoosts, setActiveBoosts] = useState<any>({});

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
    if (gameStatus !== 'playing' || !user) return;
    setGameStatus('ended');
    updateUser({ ktc: user.ktc + score });
  }, [gameStatus, score, user, updateUser]);

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
      updateUser({
        ktc: user.ktc - boost.cost,
        boosts: [...(user.boosts || []), { boostId: boost.id, quantity: 1 }],
      });
      return true;
    }
    return false;
  }, [user, updateUser]);

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
};
