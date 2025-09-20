
"use client";

import { useMemo, useEffect, useState } from "react";
import { Pickaxe, Repeat, AlertTriangle, TimerIcon, Rocket, Snowflake, Zap, Clock, Gift, Bomb, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from '@/hooks/use-game';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { getBoosts, getPowerups } from "@/lib/actions";
import type { Boost, Powerup } from "@/lib/types";

type GameItem = (Boost | Powerup) & { ownedQuantity: number; itemType: 'boost' | 'powerup' };

const iconMap: { [key: string]: React.ElementType } = {
  score_multiplier: Zap,
  extra_time: Clock,
  time_freeze: Snowflake,
  mining_bot: Bot,
  permanent_multiplier: Zap,
  bot_upgrade: Rocket,
  rocket: Rocket,
  missile: Bomb,
  frenzy: Zap,
  scoreBomb: Gift,
  extraTime: Clock,
  freezeTime: Snowflake,
};


export function GameEngine() {
  const { user } = useAuth();
  const {
    session,
    gameStatus,
    isModalOpen,
    setIsModalOpen,
    privacyWarning,
    handleTap,
    resetGame,
    activateBoost,
    activateExtraTime,
  } = useGame();

  const [allItems, setAllItems] = useState<(Boost | Powerup)[]>([]);

  useEffect(() => {
    async function fetchItems() {
      const [boosts, powerups] = await Promise.all([getBoosts(), getPowerups()]);
      setAllItems([...boosts, ...powerups]);
    }
    fetchItems();
  }, []);

  const CIRCLE_RADIUS = 100;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

  const progressOffset = useMemo(() => {
    if (!session || gameStatus !== 'playing') {
      return CIRCLE_CIRCUMFERENCE;
    }
    const totalDuration = (session.duration) * 1000;
    const timeLeft = (session.expectedEndTime - Date.now());
    const progress = Math.max(0, timeLeft / totalDuration);
    return CIRCLE_CIRCUMFERENCE - progress * CIRCLE_CIRCUMFERENCE;
  }, [session, gameStatus, CIRCLE_CIRCUMFERENCE]);
  
  const timeLeft = useMemo(() => {
    if (!session || gameStatus !== 'playing') {
      return (session?.duration || 30);
    }
    return Math.max(0, Math.round((session.expectedEndTime - Date.now()) / 1000));
  }, [session, gameStatus]);


  const activeBoostInfo = useMemo(() => {
    if (!session?.activeBoost || Date.now() >= session.activeBoost.endTime) return null;
    return {
      ...session.activeBoost,
      timeLeft: Math.max(0, Math.round((session.activeBoost.endTime - Date.now()) / 1000)),
    };
  }, [session?.activeBoost]);

  const boostTextColor = useMemo(() => {
    if (!activeBoostInfo) return 'text-foreground';
    switch (activeBoostInfo.id) {
      case 'rocket': return 'text-yellow-500';
      case 'missile': return 'text-red-500';
      case 'freezeTime': return 'text-cyan-400';
      case 'frenzy': return 'text-purple-500';
      default: return 'text-foreground';
    }
  }, [activeBoostInfo]);

  const BoostStatus = () => {
    if (gameStatus !== 'playing' || !activeBoostInfo) return null;
  
    const IconCmp = iconMap[activeBoostInfo.id] || Zap;
    const text = `${activeBoostInfo.name} active! (${activeBoostInfo.timeLeft}s)`;
  
    return (
      <span className={cn("absolute -bottom-6 flex items-center gap-1 font-bold text-xs", boostTextColor)}>
        <IconCmp className="h-4 w-4" />
        {text}
      </span>
    );
  };
  
  const allGameItems: GameItem[] = useMemo(() => {
    if (allItems.length === 0) return [];
  
    return allItems
      .filter(item => item.type !== 'mining_bot' && item.type !== 'bot_upgrade' && item.type !== 'permanent_multiplier')
      .map(item => {
        let ownedQuantity = 0;
        let itemType: 'boost' | 'powerup' = 'boost';
        if (user) {
          if ('maxQuantity' in item) { // It's a Powerup
            itemType = 'powerup';
            const ownedPowerup = user.powerups.find(p => p.powerupId === item.id);
            ownedQuantity = ownedPowerup?.quantity || 0;
          } else { // It's a Boost
            const ownedBoost = user.boosts.find(b => b.boostId === item.id);
            ownedQuantity = ownedBoost?.quantity || 0;
          }
        }
        return { ...item, ownedQuantity, itemType };
      });
  }, [user, allItems]);


  const extraTimeItems = allGameItems.filter(item => item.type === 'extra_time');
  const inGameItems = allGameItems.filter(item => item.type !== 'extra_time');


  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6">
      <div className="relative w-56 h-56 flex items-center justify-center">
        <svg className={`absolute w-[224px] h-[224px] -rotate-90 transition-all duration-300 ${gameStatus === 'playing' ? 'animate-pulse' : ''}`} style={{ filter: `drop-shadow(0 0 5px hsl(var(--primary)))`}}>
          <circle
            cx="112"
            cy="112"
            r={CIRCLE_RADIUS}
            stroke="hsl(var(--border))"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="112"
            cy="112"
            r={CIRCLE_RADIUS}
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={progressOffset}
            style={{transition: 'stroke-dashoffset 1s linear'}}
          />
        </svg>
        <button
          onClick={handleTap}
          disabled={gameStatus === 'ended'}
          className="relative w-48 h-48 bg-background rounded-full text-foreground flex flex-col items-center justify-center text-xl font-bold transition-all duration-300 ease-in-out shadow-lg hover:scale-105 active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:scale-100 disabled:cursor-not-allowed group data-[state=playing]:bg-background/80"
          aria-label="Game button"
          data-state={gameStatus}
        >
          {gameStatus === 'idle' && (
            <div className='text-center'>
              <Pickaxe className="w-12 h-12 mb-2 transition-transform group-hover:scale-110 group-active:scale-90 inline-block" />
              <span className="text-sm font-semibold">Tap to Mine</span>
            </div>
          )}
          {gameStatus === 'playing' && (
            <div className="text-center overflow-hidden">
              <div className="text-xs uppercase text-muted-foreground">KTC</div>
              <div className={cn("font-bold text-xl", boostTextColor)}>{session?.score?.toFixed(2) || '0.00'}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <TimerIcon className="h-3 w-3" />
                <span>{timeLeft}s remaining</span>
              </div>
              <BoostStatus />
            </div>
          )}
          {gameStatus === 'ended' && (
            <div className='text-center overflow-hidden'>
              <div className="text-xs uppercase text-muted-foreground">Game Over</div>
              <div className={cn("font-bold text-xl", boostTextColor)}>{session?.score?.toFixed(2) || '0.00'}</div>
              <div className="text-xs text-muted-foreground mt-1">Final Score</div>
            </div>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {gameStatus === 'idle' && (
          <>
            {extraTimeItems.map(item => {
                const Icon = iconMap[item.id] || Clock;
                return (
                  <Button key={`${item.itemType}-${item.id}`} onClick={() => activateExtraTime(item.id)} variant="outline" size="sm" disabled={item.ownedQuantity <= 0}>
                    <Icon /> +{item.value}s ({item.ownedQuantity})
                  </Button>
                )
            })}
          </>
        )}
        {gameStatus === 'playing' && (
          <>
            {inGameItems.map(item => {
              const Icon = iconMap[item.id] || Zap;
              const isDisabled = (!!activeBoostInfo && item.type !== 'scoreBomb') || item.ownedQuantity <= 0;
              return (
                  <Button key={`${item.itemType}-${item.id}`} onClick={() => activateBoost(item.id)} disabled={isDisabled} variant="outline" size="sm">
                    <Icon />({item.ownedQuantity})
                  </Button>
              )
            })}
          </>
        )}
        {gameStatus === "ended" && (
          <Button onClick={resetGame} size="lg" className="mt-4">
            <Repeat className="mr-2" />
            Mine Again
          </Button>
        )}
      </div>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="max-w-xs sm:max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" />
              Privacy Notice
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs max-h-40 overflow-y-auto">
                {privacyWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsModalOpen(false)}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
