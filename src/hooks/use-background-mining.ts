'use client';

import { useEffect, useRef } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { getBackgroundMiningSummary } from '@/lib/actions';

const KTC_PER_HOUR = 1;

export function useBackgroundMining() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      const hasMiningBot = user?.boosts.some(
        (b) => b.boostId.startsWith('bot-') && b.quantity > 0
      );

      if (!hasMiningBot) return;

      if (document.visibilityState === 'hidden') {
        startTimeRef.current = Date.now();
        localStorage.setItem('miningStartTime', startTimeRef.current.toString());
      } else if (document.visibilityState === 'visible') {
        const storedStartTime = localStorage.getItem('miningStartTime');
        const startTime = storedStartTime ? parseInt(storedStartTime, 10) : startTimeRef.current;
        
        if (startTime) {
          const endTime = Date.now();
          const hoursElapsed = (endTime - startTime) / (1000 * 60 * 60);
          const ktcMined = hoursElapsed * KTC_PER_HOUR;
          
          if (ktcMined > 0.01 && user) {
            const newKtc = user.ktc + ktcMined;
            updateUser({ ktc: newKtc });

            const summaryResult = await getBackgroundMiningSummary(
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              ktcMined
            );
            
            toast({
              title: 'Background Mining Report',
              description: summaryResult.summary,
            });
          }

          startTimeRef.current = null;
          localStorage.removeItem('miningStartTime');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, updateUser, toast]);
}
