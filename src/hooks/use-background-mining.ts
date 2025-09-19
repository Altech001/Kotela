
'use client';

import { useEffect, useRef } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { getBackgroundMiningSummary } from '@/lib/actions';

const KTC_PER_HOUR = 1;

export function useBackgroundMining() {
  const { user, updateUser, addTransaction } = useAuth();
  const { toast } = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    const processOfflineMining = async () => {
      if (!user || processedRef.current) return;

      const hasMiningBot = user.boosts.some(
        (b) => b.boostId === 'bot-1' && b.quantity > 0
      );
      if (!hasMiningBot) return;

      const lastSeen = localStorage.getItem(`lastSeen_${user.id}`);
      const now = Date.now();

      if (lastSeen) {
        const startTime = parseInt(lastSeen, 10);
        const hoursElapsed = (now - startTime) / (1000 * 60 * 60);
        // We set a minimum threshold to avoid tiny transactions on quick refreshes
        const MIN_HOURS = 0.001; // about 3.6 seconds

        if (hoursElapsed > MIN_HOURS) {
          const ktcMined = hoursElapsed * KTC_PER_HOUR;
          const newKtc = user.ktc + ktcMined;

          await updateUser({ ktc: newKtc });

          await addTransaction({
            type: 'deposit',
            amount: ktcMined,
            description: 'Background mining bot earnings',
          });

          const summaryResult = await getBackgroundMiningSummary(
            new Date(startTime).toISOString(),
            new Date(now).toISOString(),
            ktcMined
          );

          toast({
            title: 'Background Mining Report',
            description: summaryResult.summary,
          });
        }
      }
      // Mark as processed for this session to avoid re-triggering on hot-reloads
      processedRef.current = true; 
    };

    processOfflineMining();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (user) {
          localStorage.setItem(`lastSeen_${user.id}`, Date.now().toString());
        }
      } else {
         // When returning to the tab, re-process to catch time away
         processedRef.current = false;
         processOfflineMining();
      }
    };
    
    // Set timestamp when user navigates away or closes tab
    window.addEventListener('beforeunload', () => {
        if (user) {
            localStorage.setItem(`lastSeen_${user.id}`, Date.now().toString());
        }
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Ensure the timestamp is set one last time on cleanup
       if (user) {
         localStorage.setItem(`lastSeen_${user.id}`, Date.now().toString());
       }
    };
  }, [user, updateUser, toast, addTransaction]);
}
