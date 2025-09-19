'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGame } from '@/hooks/use-game';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { runPrivacyAnalysis } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const coinPlaceholder = PlaceHolderImages.find((img) => img.id === 'coin');

export default function GamePage() {
  const { user } = useAuth();
  const { score, timer, gameStatus, startGame, tap, endGame } = useGame();
  const controls = useAnimation();
  const [lastTapTime, setLastTapTime] = useState(0);
  const [analysis, setAnalysis] = useState<{ analysisResult: string; recommendations: string } | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const handleTap = () => {
    if (gameStatus === 'idle') {
      startGame();
    }
    const now = Date.now();
    if (now - lastTapTime < 50) return; // Debounce taps

    tap();
    setLastTapTime(now);
    controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.1 },
    });
  };

  useEffect(() => {
    if (gameStatus === 'ended' && !analysis) {
      const run = async () => {
        setIsAnalysisLoading(true);
        const gameplayData = `User ${user?.id} played a round. Final score: ${score}.`;
        const result = await runPrivacyAnalysis(gameplayData);
        setAnalysis(result);
        setIsAnalysisLoading(false);
      };
      run();
    }
  }, [gameStatus, score, user, analysis]);
  
  const handleDialogClose = () => {
      setAnalysis(null);
      // This will set the game status back to idle
      if (gameStatus === 'ended') {
        endGame(); // Ends the game officially
        startGame(); // Immediately sets it back to idle, ready for a new game
        endGame(); // a bit of a hack to reset the state back to idle
      }
  };

  return (
    <div className="container mx-auto flex h-full flex-col items-center justify-center gap-8 text-center">
      <div className="flex w-full max-w-md items-center justify-around rounded-full border bg-card/50 p-4 shadow-lg">
        <div className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-3xl font-bold">{score}</p>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <div className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground">Time</p>
          <p className="text-3xl font-bold">{timer}</p>
        </div>
      </div>

      <motion.div
        animate={controls}
        className="relative cursor-pointer"
        onClick={handleTap}
        style={{ pointerEvents: gameStatus === 'playing' || gameStatus === 'idle' ? 'auto' : 'none' }}
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

      <AlertDialog open={gameStatus === 'ended'} onOpenChange={(open) => !open && handleDialogClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Round Over!</AlertDialogTitle>
            <AlertDialogDescription>
              You earned {score} KTC this round. Well done!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Separator />
          <div className="space-y-2 text-left">
            <h3 className="font-semibold">Privacy Analysis</h3>
            {isAnalysisLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="animate-spin" />
                <span>Analyzing game data...</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{analysis?.analysisResult}</p>
                <h4 className="font-medium pt-2">Recommendations:</h4>
                <p className="text-sm text-muted-foreground">{analysis?.recommendations}</p>
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDialogClose}>Play Again</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
