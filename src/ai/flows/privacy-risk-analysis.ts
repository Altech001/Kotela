'use server';

/**
 * @fileOverview An AI agent to analyze gameplay data for potential privacy risks.
 *
 * - analyzePrivacyRisks - A function that analyzes gameplay data for privacy risks.
 * - PrivacyRiskAnalysisInput - The input type for the analyzePrivacyRisks function.
 * - PrivacyRiskAnalysisOutput - The return type for the analyzePrivacyRisks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrivacyRiskAnalysisInputSchema = z.object({
  gameplayData: z
    .string()
    .describe('A string containing the gameplay data to be analyzed.'),
  miningStartTime: z.string().optional().describe('The mining start time, as an ISO string.'),
  miningEndTime: z.string().optional().describe('The mining end time, as an ISO string.'),
});
export type PrivacyRiskAnalysisInput = z.infer<
  typeof PrivacyRiskAnalysisInputSchema
>;

const PrivacyRiskAnalysisOutputSchema = z.object({
  analysisResult: z
    .string()
    .describe('A concise, user-friendly summary of the privacy risk analysis. If there is a risk, state it clearly in one sentence. Otherwise, state that no significant risks were found.'),
  recommendations: z
    .string()
    .describe('A short, actionable recommendation to mitigate any identified risk. Keep it to one sentence.'),
});
export type PrivacyRiskAnalysisOutput = z.infer<
  typeof PrivacyRiskAnalysisOutputSchema
>;

export async function analyzePrivacyRisks(
  input: PrivacyRiskAnalysisInput
): Promise<PrivacyRiskAnalysisOutput> {
  return analyzePrivacyRisksFlow(input);
}

const privacyRiskAnalysisPrompt = ai.definePrompt({
  name: 'privacyRiskAnalysisPrompt',
  input: {schema: PrivacyRiskAnalysisInputSchema},
  output: {schema: PrivacyRiskAnalysisOutputSchema},
  prompt: `You are an AI privacy expert. Analyze the following gameplay data for potential privacy risks.
  Your response MUST be concise and easy for a non-technical user to understand.

  - Analyze the gameplay data: {{{gameplayData}}}
  - {{#if miningStartTime}}Also consider that background mining occurred between {{miningStartTime}} and {{miningEndTime}}.{{/if}}

  Provide a one-sentence summary for 'analysisResult'. If you find a risk related to tracking user activity, state it simply.
  Provide a one-sentence, actionable recommendation for 'recommendations' if a risk is found.
  Example output if risk is found:
  - analysisResult: "Collecting game timestamps could be used to track your activity patterns."
  - recommendations: "You can manage your privacy settings in your profile."

  Example output if no risk is found:
  - analysisResult: "No significant privacy risks were found in your gameplay data."
  - recommendations: "Your gameplay data appears to be safe."
  `,
});

const analyzePrivacyRisksFlow = ai.defineFlow(
  {
    name: 'analyzePrivacyRisksFlow',
    inputSchema: PrivacyRiskAnalysisInputSchema,
    outputSchema: PrivacyRiskAnalysisOutputSchema,
  },
  async input => {
    const {output} = await privacyRiskAnalysisPrompt(input);
    return output!;
  }
);
