"use client";

import { useMemo } from "react";
import { Pickaxe, Repeat, AlertTriangle, TimerIcon, Rocket, Bomb, Clock, Zap, Gift, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from '@/hooks/use-game';
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

export function GameEngine() {
  const {
    score,
    timer,
    gameStatus,
    activeBoosts,
    inventory,
    isModalOpen,
    setIsModalOpen,
    privacyWarning,
    gameDuration,
    timeBoostUsed,
    handleTap,
    resetGame,
    activateBoost,
    activateTimeBoost,
    activateFrenzy,
    activateTimeFreeze,
  } = useGame();

  const CIRCLE_RADIUS = 100;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  const progressOffset =
    CIRCLE_CIRCUMFERENCE -
    (timer / gameDuration) * CIRCLE_CIRCUMFERENCE;

  const boostTextColor = useMemo(() => {
    if (activeBoosts.score_multiplier) return 'text-yellow-500';
    if (activeBoosts.time_freeze) return 'text-cyan-400';
    if (activeBoosts.frenzy) return 'text-purple-500';
    return 'text-foreground';
  }, [activeBoosts]);

  const BoostStatus = () => {
    if (gameStatus !== 'playing') return null;
  
    let icon = null;
    let text = '';
  
    if (activeBoosts.score_multiplier) {
      icon = <Rocket className="h-4 w-4" />;
      text = `${activeBoosts.score_multiplier.value}x Boost! (${activeBoosts.score_multiplier.timeLeft}s)`;
    } else if (activeBoosts.time_freeze) {
      icon = <Snowflake className="h-4 w-4" />;
      text = `Time Frozen! (${activeBoosts.time_freeze.timeLeft}s)`;
    } else if (activeBoosts.frenzy) {
      icon = <Zap className="h-4 w-4" />;
      text = `Frenzy Mode! (${activeBoosts.frenzy.timeLeft}s)`;
    } else {
      return null;
    }
  
    return (
      <span className={`absolute -bottom-6 flex items-center gap-1 font-bold text-xs ${boostTextColor}`}>
        {icon}
        {text}
      </span>
    );
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6">
      <div className="relative w-56 h-56 flex items-center justify-center">
        <svg className={`absolute w-[224px] h-[224px] -rotate-90 transition-all duration-300 ${gameStatus === 'playing' ? 'animate-glow' : ''}`} style={{ filter: `drop-shadow(0 0 5px hsl(var(--primary)))`}}>
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
            className="transition-all duration-1000 ease-linear"
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
              <span className="text-lg font-semibold">Tap to Mine</span>
            </div>
          )}
          {gameStatus === 'playing' && (
            <div className="text-center overflow-hidden">
              <div className="text-xs uppercase text-muted-foreground">Coins</div>
              <div className={cn("font-bold text-xl", boostTextColor)}>{score.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <TimerIcon className="h-3 w-3" />
                <span>{timer}s remaining</span>
              </div>
              <BoostStatus />
            </div>
          )}
          {gameStatus === 'ended' && (
            <div className='text-center overflow-hidden'>
              <div className="text-xs uppercase text-muted-foreground">Game Over</div>
              <div className={cn("font-bold text-xl", boostTextColor)}>{score.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">Final Coins</div>
            </div>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {gameStatus === 'idle' && (
           <Button
            onClick={() => activateTimeBoost('extra-time-10')}
            disabled={(inventory.extra_time || 0) <= 0 || timeBoostUsed}
            size="sm"
            variant="outline"
          >
            <Clock className="mr-2" />
            Use Extra Time ({inventory.extra_time || 0})
          </Button>
        )}
        {gameStatus === 'playing' && (
          <>
            <Button onClick={() => activateBoost('multiplier-2x')} disabled={(inventory.score_multiplier || 0) <= 0 || Object.keys(activeBoosts).length > 0} variant="outline" size="sm"><Rocket />({inventory.score_multiplier || 0})</Button>
            <Button onClick={() => activateTimeFreeze('time-freeze-5')} disabled={(inventory.time_freeze || 0) <= 0 || Object.keys(activeBoosts).length > 0} variant="outline" size="sm" className="text-cyan-400 border-cyan-400 hover:bg-cyan-400 hover:text-white"><Snowflake />({inventory.time_freeze || 0})</Button>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Privacy Warning
            </AlertDialogTitle>
            <AlertDialogDescription>{privacyWarning}</AlertDialogDescription>
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
