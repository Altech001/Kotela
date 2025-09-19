'use server';

import { analyzePrivacyRisks } from '@/ai/flows/privacy-risk-analysis';
import { backgroundMiningSummary } from '@/ai/flows/background-mining-summary';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { User } from '@/lib/types';

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
