'use client';
import type { Boost } from '@/lib/types';
import { createContext } from 'react';

export type GameStatus = 'idle' | 'playing' | 'ended';

type GameContextType = {
  score: number;
  timer: number;
  gameStatus: GameStatus;
  startGame: () => void;
  tap: () => void;
  endGame: () => void;
  buyBoost: (boost: Boost) => boolean;
  activeBoosts: any; // Simplified for this example
  activateBoost: (boostId: string) => void;
};

export const GameContext = createContext<GameContextType | undefined>(undefined);
