
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, addDoc, serverTimestamp, where, doc, getDoc, writeBatch, deleteDoc, setDoc, arrayUnion, updateDoc, increment } from 'firebase/firestore';
import type { User, Comment, Boost, Powerup, Notification, MobileMoneyAccount, Transaction, Announcement, BonusGame, Video, KycSubmission, AdvertiserProfile, P2PListing, P2PPaymentMethod, P2PRegion, EnrichedP2PListing } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { startOfDay, endOfDay } from 'date-fns';


export async function getLeaderboard(): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('ktc', 'desc'));
    const querySnapshot = await getDocs(q);
    const users: User[] = [];

    querySnapshot.forEach((doc) => {
      const user = doc.data() as User;
      const transactions = user.transactions || [];
      
      const totalBotRevenue = transactions
        .filter(tx => tx.description?.toLowerCase().includes('background mining'))
        .reduce((sum, tx) => sum + tx.amount, 0);

      const activeBotCount = (user.boosts || []).filter(b => b.botType === 'background' && b.active).length;

      users.push({
        ...user,
        totalBotRevenue,
        activeBotCount
      });
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
  const q = query(accountsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const accounts = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      return { id: doc.id, ...data, createdAt } as MobileMoneyAccount;
  });
  
  // Sort manually after fetching
  return accounts.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
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

export async function getAnnouncements(): Promise<Announcement[]> {
    try {
        const ref = collection(db, 'announcements');
        const q = query(ref, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate().toISOString(),
            } as Announcement;
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }
}

export async function getBonusGames(): Promise<BonusGame[]> {
    try {
        const bonusGamesRef = collection(db, 'bonusGames');
        const snapshot = await getDocs(query(bonusGamesRef, orderBy('order')));
        if (snapshot.empty) {
            // Seed the data if it doesn't exist
            await seedBonusGames();
            const newSnapshot = await getDocs(query(bonusGamesRef, orderBy('order')));
            return newSnapshot.docs.map(doc => doc.data() as BonusGame);
        }
        return snapshot.docs.map(doc => doc.data() as BonusGame);
    } catch (e) {
        console.error("Error fetching bonus games: ", e);
        return [];
    }
}

export async function getBonusGameDetails(gameId: string): Promise<BonusGame | null> {
    try {
        const gameRef = doc(db, 'bonusGames', gameId);
        const docSnap = await getDoc(gameRef);
        return docSnap.exists() ? docSnap.data() as BonusGame : null;
    } catch (error) {
        console.error("Error fetching game details:", error);
        return null;
    }
}

export async function getVideos(): Promise<Video[]> {
    try {
        const videosRef = collection(db, 'videos');
        const snapshot = await getDocs(query(videosRef, orderBy('id')));
         if (snapshot.empty) {
            await seedVideos();
            const newSnapshot = await getDocs(query(videosRef, orderBy('id')));
            return newSnapshot.docs.map(doc => doc.data() as Video);
        }
        return snapshot.docs.map(doc => doc.data() as Video);
    } catch (e) {
        console.error("Error fetching videos: ", e);
        return [];
    }
}

async function seedBonusGames() {
    const batch = writeBatch(db);
    const now = Date.now();
    const games: Omit<BonusGame, 'id'>[] = [
        { name: 'Puzzle Game', description: 'Solve an AI-generated puzzle to win a prize!', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.43 12.03c.25.82.25 1.71 0 2.54l-1.73 4.41a2 2 0 0 1-3.46.35l-1.73-4.41a2.43 2.43 0 0 0-2.54 0l-1.73 4.41a2 2 0 0 1-3.46-.35l-1.73-4.41a2.43 2.43 0 0 0 0-2.54l1.73-4.41a2 2 0 0 1 3.46-.35l1.73 4.41c.82.25 1.71.25 2.54 0l1.73-4.41a2 2 0 0 1 3.46.35l1.73 4.41z"/></svg>', order: 1, availableTimestamp: now, cooldownMinutes: 120 },
        { name: 'VideoAds', description: 'Watch videos to earn rewards.', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>', order: 2, availableTimestamp: now },
        { name: 'WiseMan', description: "Stake your coins and answer the WiseMan's question. Win and get rewarded, fail and lose your stake.", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="m9 9.5 2 2 4-4"/></svg>', order: 3, availableTimestamp: now + 2 * 60 * 60 * 1000, durationMinutes: 60 },
        { id: 'lucky-dice', name: 'Lucky Dice', description: 'Roll the dice and win rewards based on your roll.', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M16 8h.01"/><path d="M12 12h.01"/><path d="M8 8h.01"/><path d="M8 12h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M12 16h.01"/></svg>', order: 4, availableTimestamp: now },
        { id: 'coin-flip', name: 'Coin Flip', description: 'Flip a coin and double your stake, or lose it all.', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7.5a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10s10-4.48 10-10a10 10 0 0 0-10-10z"/><path d="M12 8c-3.87 0-7 3.13-7 7"/><path d="M12 2v2"/><path d="M12 19v2"/></svg>', order: 5, availableTimestamp: now, cooldownMinutes: 5 },
      ];

    const ids = ['puzzle-game', 'video-play', 'wiseman', 'lucky-dice', 'coin-flip'];
    
    games.forEach((game, index) => {
        const gameWithId = { ...game, id: ids[index] };
        const docRef = doc(db, 'bonusGames', gameWithId.id);
        batch.set(docRef, gameWithId);
    });
    await batch.commit();
}

async function seedVideos() {
    const batch = writeBatch(db);
    const videos: Video[] = [
        { id: 1, title: 'Learn App Hosting', duration: '1:40', reward: 50, youtubeId: 'Vxa_DzLtlTI', watchTime: 60 },
        { id: 2, title: 'AI-powered Apps with Firebase', duration: '6:37', reward: 75, youtubeId: 'LXb3EKWsInQ', watchTime: 60 },
        { id: 3, title: 'Get Started with Firebase', duration: '3:00', reward: 100, youtubeId: 'Vxa_DzLtlTI', watchTime: 60 },
        { id: 4, title: 'Firebase Crashlytics', duration: '9:25', reward: 150, youtubeId: 'Vxa_DzLtlTI', watchTime: 60 },
        { id: 5, title: 'Firebase Remote Config', duration: '5:10', reward: 125, youtubeId: 'Vxa_DzLtlTI', watchTime: 60 },
        { id: 6, title: 'Build a Gen AI chat app', duration: '8:15', reward: 200, youtubeId: 'LXb3EKWsInQ', watchTime: 60 },
        { id: 7, title: 'What is Genkit?', duration: '0:25', reward: 110, youtubeId: 'Vxa_DzLtlTI', watchTime: 25 },
        { id: 8, title: 'The future of AI', duration: '0:55', reward: 250, youtubeId: 'LXb3EKWsInQ', watchTime: 55 },
    ];
    videos.forEach(video => {
        const docRef = doc(db, 'videos', video.id.toString());
        batch.set(docRef, video);
    });
    await batch.commit();
}

export async function submitKyc(submission: Omit<KycSubmission, 'id' | 'status' | 'submittedAt'>) {
    const kycRef = collection(db, 'kycSubmissions');
    
    // Check if a submission already exists for the user
    const q = query(kycRef, where('userId', '==', submission.userId));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
        // Update existing submission instead of creating a new one
        const docRef = existing.docs[0].ref;
        await setDoc(docRef, {
            ...submission,
            status: 'pending',
            submittedAt: serverTimestamp(),
        }, { merge: true });
        return docRef.id;
    } else {
        // Create new submission
        const docRef = await addDoc(kycRef, {
            ...submission,
            status: 'pending',
            submittedAt: serverTimestamp(),
        });
        return docRef.id;
    }
}

export async function getKycSubmission(userId: string): Promise<KycSubmission | null> {
    const kycRef = collection(db, 'kycSubmissions');
    const q = query(kycRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt.toDate().toISOString(),
    } as KycSubmission;
}

// P2P Advertiser Actions

async function seedP2PConfig() {
    const batch = writeBatch(db);
    const p2pConfigRef = collection(db, 'p2pConfig');

    const paymentMethods: P2PPaymentMethod[] = [
        { id: 'sepa', name: 'SEPA (EU) bank transfer', category: 'bank' },
        { id: 'bank_transfer', name: 'Bank Transfer', category: 'bank' },
        { id: 'zen', name: 'ZEN', category: 'e-wallet' },
        { id: 'pesapal', name: 'Pesapal', category: 'mobile' },
        { id: 'jpesa', name: 'Jpesa', category: 'mobile' },
        { id: 'transid', name: 'TransID', category: 'mobile' },
    ];

    const regions: P2PRegion[] = [
        { id: 'eu', name: 'Europe' },
        { id: 'us', name: 'United States' },
        { id: 'asia', name: 'Asia' },
        { id: 'africa', name: 'Africa' },
        { id: 'global', name: 'Global' },
    ];
    
    paymentMethods.forEach(method => {
        const docRef = doc(p2pConfigRef, `paymentMethods_${method.id}`);
        batch.set(docRef, method);
    });

    regions.forEach(region => {
        const docRef = doc(p2pConfigRef, `regions_${region.id}`);
        batch.set(docRef, region);
    });

    await batch.commit();
}


export async function getP2PPaymentMethods(): Promise<P2PPaymentMethod[]> {
    const ref = collection(db, 'p2pConfig');
    const q = query(ref, where('category', 'in', ['bank', 'e-wallet', 'mobile']));
    const snapshot = await getDocs(q);
    if(snapshot.empty) {
        await seedP2PConfig();
        const newSnapshot = await getDocs(q);
        return newSnapshot.docs.map(doc => doc.data() as P2PPaymentMethod);
    }
    return snapshot.docs.map(doc => doc.data() as P2PPaymentMethod);
}

export async function getP2PRegions(): Promise<P2PRegion[]> {
    const ref = collection(db, 'p2pConfig');
    const q = query(ref, where('name', '!=', '')); // Simple query to get all regions
    const snapshot = await getDocs(q);
     if(snapshot.empty) {
        await seedP2PConfig();
        const newSnapshot = await getDocs(query(ref, where('name', '!=', '')));
        return newSnapshot.docs.map(doc => doc.data() as P2PRegion);
    }
    const regions = snapshot.docs.map(doc => doc.data())
        .filter(data => data.category === undefined) as P2PRegion[];
    return regions;
}


export async function createOrUpdateAdvertiser(profile: Omit<AdvertiserProfile, 'createdAt' | 'orders' | 'completion' | 'rating' | 'avgReleaseTime'>, initialListing: Omit<P2PListing, 'id' | 'advertiserId' | 'createdAt'>): Promise<void> {
    const batch = writeBatch(db);
    
    const advertiserRef = doc(db, 'p2pAdvertisers', profile.userId);
    const listingRef = doc(collection(db, 'p2pListings'));
    const userRef = doc(db, 'users', profile.userId);

    const newProfile: AdvertiserProfile = {
        ...profile,
        orders: 0,
        completion: 100,
        rating: 5,
        avgReleaseTime: 5,
        createdAt: new Date().toISOString(),
    };
    
    const newListing = {
        ...initialListing,
        advertiserId: profile.userId,
        createdAt: serverTimestamp(),
    };
    
    batch.set(advertiserRef, newProfile, { merge: true });
    batch.set(listingRef, newListing);
    batch.update(userRef, { isP2PAdvertiser: true });

    await batch.commit();
}


export async function getAdvertiserProfile(userId: string): Promise<AdvertiserProfile | null> {
    const docRef = doc(db, 'p2pAdvertisers', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        } as AdvertiserProfile;
    }
    return null;
}

export async function getAdvertiserListings(userId: string): Promise<P2PListing[]> {
  const listingsRef = collection(db, 'p2pListings');
  const q = query(listingsRef, where('advertiserId', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      } as P2PListing
  });
}

export async function updateAdvertiserListing(listingId: string, updates: Partial<P2PListing>): Promise<void> {
    const listingRef = doc(db, 'p2pListings', listingId);
    await updateDoc(listingRef, updates);
}

export async function updateAdvertiserStatus(userId: string, isOnline: boolean): Promise<void> {
    const advertiserRef = doc(db, 'p2pAdvertisers', userId);
    await updateDoc(advertiserRef, { isOnline });
}

export async function getActiveP2PListings(): Promise<EnrichedP2PListing[]> {
    const listingsRef = collection(db, 'p2pListings');
    const listingsSnapshot = await getDocs(listingsRef);

    if (listingsSnapshot.empty) {
        return [];
    }

    const enrichedListings: EnrichedP2PListing[] = [];

    for (const listingDoc of listingsSnapshot.docs) {
        const listing = {
            id: listingDoc.id,
            ...listingDoc.data(),
            createdAt: listingDoc.data().createdAt?.toDate ? listingDoc.data().createdAt.toDate().toISOString() : new Date().toISOString(),
        } as P2PListing;

        if (listing.advertiserId) {
            const advertiserRef = doc(db, 'p2pAdvertisers', listing.advertiserId);
            const advertiserSnap = await getDoc(advertiserRef);

            if (advertiserSnap.exists()) {
                const advertiser = advertiserSnap.data() as AdvertiserProfile;
                if (advertiser.isOnline) {
                    enrichedListings.push({
                        ...listing,
                        advertiser: {
                            ...advertiser,
                            createdAt: advertiser.createdAt?.toDate ? advertiser.createdAt.toDate().toISOString() : new Date().toISOString(),
                        },
                    });
                }
            }
        }
    }

    return enrichedListings.sort((a,b) => b.price - a.price);
}
