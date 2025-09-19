
'use server';

import { analyzePrivacyRisks } from '@/ai/flows/privacy-risk-analysis';
import { backgroundMiningSummary } from '@/ai/flows/background-mining-summary';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, addDoc, serverTimestamp, where, doc, getDoc } from 'firebase/firestore';
import type { User, Comment, Boost } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function runPrivacyAnalysis(gameplayData: string) {
  try {
    const result = await analyzePrivacyRisks({ gameplayData });
    return result;
  } catch (error) {
    console.error('Error in privacy analysis:', error);
    return {
      analysisResult: 'Could not analyze privacy risks at this time.',
      recommendations: 'Please try again later.',
    };
  }
}

export async function getBackgroundMiningSummary(
  startTime: string,
  endTime: string,
  ktcMined: number
) {
  try {
    const result = await backgroundMiningSummary({
      startTime,
      endTime,
      ktcMined,
    });
    return result;
  } catch (error) {
    console.error('Error in background mining summary:', error);
    return {
      summary: `You mined ${ktcMined.toFixed(2)} KTC while you were away.`,
    };
  }
}


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
