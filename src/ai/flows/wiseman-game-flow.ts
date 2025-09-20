
'use server';
/**
 * @fileOverview A trivia game AI agent for the WiseMan game.
 *
 * - getWisemanQuestion - A function that generates a trivia question and answer.
 * - verifyWisemanAnswer - A function that verifies a user's answer.
 * - WisemanQuestion - The output type for the getWisemanQuestion function.
 * - VerifyWisemanAnswerInput - The input type for the verifyWisemanAnswer function.
 * - VerifyWisemanAnswerOutput - The return type for the verifyWisemanAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WisemanQuestionSchema = z.object({
  question: z.string().describe('A challenging trivia question.'),
  answer: z.string().describe('The correct answer to the question.'),
  category: z.string().describe('The category of the question (e.g., History, Science).'),
});
export type WisemanQuestion = z.infer<typeof WisemanQuestionSchema>;

const VerifyWisemanAnswerInputSchema = z.object({
  question: z.string().describe('The original question that was asked.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  userAnswer: z.string().describe("The user's provided answer."),
});
export type VerifyWisemanAnswerInput = z.infer<typeof VerifyWisemanAnswerInputSchema>;

const VerifyWisemanAnswerOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user\'s answer is correct.'),
  explanation: z.string().describe('A brief explanation of why the answer is correct or incorrect.'),
});
export type VerifyWisemanAnswerOutput = z.infer<typeof VerifyWisemanAnswerOutputSchema>;

export async function getWisemanQuestion(): Promise<WisemanQuestion> {
  return getWisemanQuestionFlow();
}

export async function verifyWisemanAnswer(input: VerifyWisemanAnswerInput): Promise<VerifyWisemanAnswerOutput> {
    return verifyWisemanAnswerFlow(input);
}


const questionPrompt = ai.definePrompt({
  name: 'getWisemanQuestionPrompt',
  output: {schema: WisemanQuestionSchema},
  prompt: `You are the WiseMan. Generate a single, challenging but answerable trivia question on any topic. Provide the question, the correct answer, and the category.`,
});

const getWisemanQuestionFlow = ai.defineFlow(
  {
    name: 'getWisemanQuestionFlow',
    outputSchema: WisemanQuestionSchema,
  },
  async () => {
    const {output} = await questionPrompt();
    return output!;
  }
);

const verificationPrompt = ai.definePrompt({
    name: 'verifyWisemanAnswerPrompt',
    input: {schema: VerifyWisemanAnswerInputSchema},
    output: {schema: VerifyWisemanAnswerOutputSchema},
    prompt: `You are the WiseMan, an expert judge of trivia answers. The user was asked the following question:
  
    Question: {{{question}}}
    Correct Answer: {{{correctAnswer}}}
  
    The user provided this answer:
    User's Answer: {{{userAnswer}}}
  
    Determine if the user's answer is correct. Be lenient with minor spelling mistakes or variations, but strict on the core facts.
    
    Provide a boolean for 'isCorrect' and a brief 'explanation' for your decision.`,
  });
  
  const verifyWisemanAnswerFlow = ai.defineFlow(
    {
      name: 'verifyWisemanAnswerFlow',
      inputSchema: VerifyWisemanAnswerInputSchema,
      outputSchema: VerifyWisemanAnswerOutputSchema,
    },
    async (input) => {
      const {output} = await verificationPrompt(input);
      return output!;
    }
  );
