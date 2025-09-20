
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { getBackgroundMiningSummary, addNotification } from '@/lib/actions';

const KTC_PER_HOUR = 1;

export function useBackgroundMining() {
  const { user, updateUser, addTransaction } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    const processOfflineMining = async () => {
      if (!user || processedRef.current) return;

      const hasMiningBot = (user.powerups || []).some(p => p.powerupId === 'bot-1' && p.quantity > 0) || (user.boosts || []).some(b => b.boostId === 'bot-1' && b.quantity > 0);
      if (!hasMiningBot) return;

      const lastSeen = localStorage.getItem(`lastSeen_${user.id}`);
      const now = Date.now();

      if (lastSeen) {
        const startTime = parseInt(lastSeen, 10);
        const hoursElapsed = (now - startTime) / (1000 * 60 * 60);
        const MIN_HOURS = 0.001; // about 3.6 seconds

        if (hoursElapsed > MIN_HOURS) {
          
          let rate = KTC_PER_HOUR;
          const botUpgrade = user.powerups.find(p => p.powerupId === 'bot-upgrade-1');
          if(botUpgrade) rate *= botUpgrade.value;

          const ktcMined = hoursElapsed * rate;
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
          
          await addNotification(user.id, {
            title: 'Background Mining Report',
            description: summaryResult.summary,
          });
        }
      }
      processedRef.current = true; 
    };

    processOfflineMining();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (user) {
          localStorage.setItem(`lastSeen_${user.id}`, Date.now().toString());
        }
      } else {
         processedRef.current = false;
         processOfflineMining();
      }
    };
    
    window.addEventListener('beforeunload', () => {
        if (user) {
            localStorage.setItem(`lastSeen_${user.id}`, Date.now().toString());
        }
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
       if (user) {
         localStorage.setItem(`lastSeen_${user.id}`, Date.now().toString());
       }
    };
  }, [user, updateUser, addTransaction]);
}
