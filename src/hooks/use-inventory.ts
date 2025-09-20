
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { UserInventoryItem } from '@/lib/types';

export function useInventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setInventory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const inventoryRef = collection(db, 'userInventory');
    const q = query(inventoryRef, where('userId', '==', user.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: UserInventoryItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as UserInventoryItem);
      });
      setInventory(items);
      setLoading(false);
    }, (error) => {
        console.error("Failed to fetch inventory:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getCountOfItem = (itemId: string) => {
    return inventory.filter(item => item.itemId === itemId).length;
  };

  return { inventory, loading, getCountOfItem };
}
