
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, addDoc, serverTimestamp, where, doc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import type { User, Comment, Boost, Powerup, Notification, MobileMoneyAccount, Transaction } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { startOfDay, endOfDay } from 'date-fns';


export async function getLeaderboard() {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('ktc', 'desc'));
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    return users;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return [];
  }
}

export async function getComments(postId: string): Promise<Comment[]> {
  try {
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, where('postId', '==', postId), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Firestore timestamps need to be converted
      const date = data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString();
      comments.push({
        id: doc.id,
        postId: data.postId,
        userId: data.userId,
        author: data.author,
        authorImage: data.authorImage,
        date: date,
        content: data.content,
      });
    });
    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

export async function addComment(comment: Omit<Comment, 'id' | 'date'>): Promise<Comment> {
    const newComment = {
        ...comment,
        date: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, "comments"), newComment);

    revalidatePath('/news');

    return {
        ...comment,
        id: docRef.id,
        date: new Date().toISOString() // return an estimated timestamp
    };
}


export async function getBoosts(): Promise<Boost[]> {
  try {
    const boostsRef = collection(db, 'boosts');
    const q = query(boostsRef, orderBy('cost', 'asc'));
    const querySnapshot = await getDocs(q);
    const boosts: Boost[] = [];
    querySnapshot.forEach((doc) => {
      boosts.push(doc.data() as Boost);
    });
    return boosts;
  } catch (error) {
    console.error('Error fetching boosts:', error);
    return [];
  }
}

export async function getPowerups(): Promise<Powerup[]> {
  try {
    const powerupsRef = collection(db, 'powerups');
    const q = query(powerupsRef, orderBy('cost', 'asc'));
    const querySnapshot = await getDocs(q);
    const powerups: Powerup[] = [];
    querySnapshot.forEach((doc) => {
      powerups.push(doc.data() as Powerup);
    });
    return powerups;
  } catch (error) {
    console.error('Error fetching power-ups:', error);
    return [];
  }
}


export async function getBoost(boostId: string): Promise<Boost | null> {
  try {
    const boostRef = doc(db, 'boosts', boostId);
    const docSnap = await getDoc(boostRef);
    if (docSnap.exists()) {
      return docSnap.data() as Boost;
    }
    return null;
  } catch (error) {
    console.error('Error fetching boost:', error);
    return null;
  }
}

export async function getPowerup(powerupId: string): Promise<Powerup | null> {
  try {
    const powerupRef = doc(db, 'powerups', powerupId);
    const docSnap = await getDoc(powerupRef);
    if (docSnap.exists()) {
      return docSnap.data() as Powerup;
    }
    return null;
  } catch (error) {
    console.error('Error fetching powerup:', error);
    return null;
  }
}

export async function getDailyMines(userId: string, date: string): Promise<{timestamp: string, score: number}[]> {
    try {
        const dailyMinesRef = doc(db, 'users', userId, 'dailyMines', date);
        const docSnap = await getDoc(dailyMinesRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Sort by score descending and return
            return (data.scores || []).sort((a: {score: number}, b: {score: number}) => b.score - a.score);
        }
        return [];
    } catch (error) {
        console.error('Error fetching daily mines:', error);
        return [];
    }
}

export async function addNotification(userId: string, notificationData: Omit<Notification, 'id' | 'userId' | 'timestamp' | 'isRead'>) {
    try {
        const notificationsRef = collection(db, 'users', userId, 'notifications');
        const newNotification = {
            ...notificationData,
            userId,
            timestamp: serverTimestamp(),
            isRead: false,
        };
        await addDoc(notificationsRef, newNotification);
    } catch (error) {
        console.error("Error adding notification:", error);
    }
}

export async function markNotificationsAsRead(userId: string, notificationIds: string[]) {
    try {
        const batch = writeBatch(db);
        const notificationsRef = collection(db, 'users', userId, 'notifications');
        notificationIds.forEach(id => {
            const docRef = doc(notificationsRef, id);
            batch.update(docRef, { isRead: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications as read:", error);
    }
}

export async function getReferredUsers(referrerId: string): Promise<User[]> {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('referredBy', '==', referrerId));
        const querySnapshot = await getDocs(q);
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data() as User);
        });
        return users;
    } catch (error) {
        console.error('Error fetching referred users:', error);
        return [];
    }
}

export async function getMobileMoneyAccounts(userId: string): Promise<MobileMoneyAccount[]> {
  const accountsRef = collection(db, 'mobileMoneyAccounts');
  const q = query(accountsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MobileMoneyAccount));
}

export async function addMobileMoneyAccount(accountData: Omit<MobileMoneyAccount, 'id' | 'createdAt'>) {
  const newAccount = {
    ...accountData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'mobileMoneyAccounts'), newAccount);
  return { id: docRef.id, ...accountData, createdAt: new Date().toISOString() };
}

export async function deleteMobileMoneyAccount(accountId: string) {
  const accountRef = doc(db, 'mobileMoneyAccounts', accountId);
  await deleteDoc(accountRef);
}

export async function getDailyWithdrawals(userId: string): Promise<Transaction[]> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return [];

  const allTransactions = (userDoc.data().transactions || []) as Transaction[];
  const todayStart = startOfDay(new Date());

  return allTransactions
    .filter(tx => 
        tx.type === 'withdrawal' && 
        new Date(tx.timestamp) >= todayStart
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
