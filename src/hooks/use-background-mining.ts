
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { addNotification } from '@/lib/actions';
import { backgroundMiningSummary } from '@/ai/flows/background-mining-summary';
import { db } from '@/lib/firebase';
import { doc, runTransaction, arrayUnion } from 'firebase/firestore';


const KTC_PER_HOUR = 1;

export function useBackgroundMining() {
  const { user, updateUser, addTransaction } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    const processOfflineMining = async () => {
      if (!user || processedRef.current) return;

      const activeMiningBots = (user.boosts || []).filter(b => b.type === 'mining_bot' && b.active);
      if (activeMiningBots.length === 0) return;

      const lastSeen = localStorage.getItem(`lastSeen_${user.id}`);
      const now = Date.now();

      if (lastSeen) {
        const startTime = parseInt(lastSeen, 10);
        const hoursElapsed = (now - startTime) / (1000 * 60 * 60);
        const MIN_HOURS = 0.001; // about 3.6 seconds

        if (hoursElapsed > MIN_HOURS) {
          
          let rate = KTC_PER_HOUR;
          const botUpgrade = (user.powerups || []).find(p => p.powerupId === 'bot-upgrade-1');
          if(botUpgrade) rate *= botUpgrade.value;
          
          const totalRate = rate * activeMiningBots.length;
          const ktcMined = hoursElapsed * totalRate;

          if (ktcMined > 0) {
            try {
              await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', user.id);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) return;

                const currentKtc = userDoc.data().ktc;
                const newKtc = currentKtc + ktcMined;
                
                transaction.update(userRef, { ktc: newKtc });

                const newTransaction = {
                  type: 'deposit',
                  amount: ktcMined,
                  description: `Background mining from ${activeMiningBots.length} bot(s)`,
                  timestamp: new Date().toISOString(),
                  id: `tx-${Date.now()}`
                };
                transaction.update(userRef, { transactions: arrayUnion(newTransaction) });
              });
            } catch (e) {
              console.error("Failed to update KTC from background mining", e)
            }


            try {
              const summaryResult = await backgroundMiningSummary({
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(now).toISOString(),
                ktcMined: ktcMined,
              });
              
              await addNotification(user.id, {
                title: 'Background Mining Report',
                description: summaryResult.summary,
              });
            } catch (e) {
                console.error("Could not get background mining summary", e);
                await addNotification(user.id, {
                    title: 'Background Mining Report',
                    description: `Your bots mined ${ktcMined.toFixed(4)} KTC while you were away.`,
                });
            }
          }
        }
      }
      processedRef.current = true; 
    };

    if (user) {
        processOfflineMining();
    }


    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (user) {
          localStorage.setItem(`lastSeen_${user.id}`, Date.now().toString());
        }
      } else if (document.visibilityState === 'visible') {
         processedRef.current = false;
         if (user) {
            processOfflineMining();
         }
      }
    };
    
    const handleBeforeUnload = () => {
        if (user) {
            localStorage.setItem(`lastSeen_${user.id}`, Date.now().toString());
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);
}

    