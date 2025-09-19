
'use client';

import { Button } from '@/components/ui/button';
import { useGame } from '@/hooks/use-game';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { motion, useAnimation } from 'framer-motion';
import { useState } from 'react';
import { Card } from './ui/card';
import { Separator } from './ui/separator';

const coinPlaceholder = PlaceHolderImages.find((img) => img.id === 'coin');

export function GameEngine() {
  const { score, timer, gameStatus, startGame, tap } = useGame();
  const controls = useAnimation();
  const [lastTapTime, setLastTapTime] = useState(0);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapTime < 50) return; // Debounce taps

    if (gameStatus === 'idle') {
        startGame();
    }

    tap();
    setLastTapTime(now);
    controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.1 },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center">
        <Card className="flex w-full max-w-xs items-center justify-around rounded-full border bg-card/50 p-4 shadow-lg">
            <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-3xl font-bold">{score.toFixed(0)}</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground">Time</p>
            <p className="text-3xl font-bold">{timer}</p>
            </div>
        </Card>

      <motion.div
        animate={controls}
        className="relative cursor-pointer"
        onClick={handleTap}
      >
        {coinPlaceholder && (
          <Image
            src={coinPlaceholder.imageUrl}
            alt={coinPlaceholder.description}
            width={256}
            height={256}
            className="rounded-full shadow-2xl transition-transform duration-200 hover:scale-105"
            priority
            data-ai-hint={coinPlaceholder.imageHint}
          />
        )}
      </motion.div>

      {gameStatus !== 'playing' && (
        <Button onClick={startGame} size="lg" className="text-lg">
          {gameStatus === 'ended' ? 'Play Again' : 'Start Game'}
        </Button>
      )}
    </div>
  );
}
