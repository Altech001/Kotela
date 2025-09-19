'use server';

/**
 * @fileOverview A flow to summarize the KTC mined in the background.
 *
 * - backgroundMiningSummary - A function that handles the KTC mining summary process.
 * - BackgroundMiningSummaryInput - The input type for the backgroundMiningSummary function.
 * - BackgroundMiningSummaryOutput - The return type for the backgroundMiningSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BackgroundMiningSummaryInputSchema = z.object({
  startTime: z.string().describe('The start time of background mining as an ISO string.'),
  endTime: z.string().describe('The end time of background mining as an ISO string.'),
  ktcMined: z.number().describe('The amount of KTC mined in the background.'),
});
export type BackgroundMiningSummaryInput = z.infer<typeof BackgroundMiningSummaryInputSchema>;

const BackgroundMiningSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the KTC mined in the background.'),
});
export type BackgroundMiningSummaryOutput = z.infer<typeof BackgroundMiningSummaryOutputSchema>;

export async function backgroundMiningSummary(input: BackgroundMiningSummaryInput): Promise<BackgroundMiningSummaryOutput> {
  return backgroundMiningSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'backgroundMiningSummaryPrompt',
  input: {schema: BackgroundMiningSummaryInputSchema},
  output: {schema: BackgroundMiningSummaryOutputSchema},
  prompt: `You are an assistant that summarizes the amount of KTC mined in the background.

  Start Time: {{{startTime}}}
  End Time: {{{endTime}}}
  KTC Mined: {{{ktcMined}}}

  Provide a concise summary of the KTC mined during this period.`,
});

const backgroundMiningSummaryFlow = ai.defineFlow(
  {
    name: 'backgroundMiningSummaryFlow',
    inputSchema: BackgroundMiningSummaryInputSchema,
    outputSchema: BackgroundMiningSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
