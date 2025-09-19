'use server';

import { analyzePrivacyRisks } from '@/ai/flows/privacy-risk-analysis';
import { backgroundMiningSummary } from '@/ai/flows/background-mining-summary';

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
