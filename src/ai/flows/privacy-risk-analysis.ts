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
    .describe('The analysis result of the gameplay data for privacy risks.'),
  recommendations: z
    .string()
    .describe('Recommendations to mitigate the identified privacy risks.'),
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
  prompt: `You are an AI privacy expert analyzing gameplay data for potential risks.

  Analyze the following gameplay data and provide an analysis result and recommendations to mitigate the identified privacy risks.

  Gameplay Data: {{{gameplayData}}}

  {{#if miningStartTime}}
  Also take into account that mining occurred between {{miningStartTime}} and {{miningEndTime}} when analyzing the data.
  {{/if}}
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
