'use server';

/**
 * @fileOverview A flow for querying incident anomalies in specific zones.
 *
 * - queryIncidentAnomalies - A function that handles querying incident anomalies.
 * - QueryIncidentAnomaliesInput - The input type for the queryIncidentAnomalies function.
 * - QueryIncidentAnomaliesOutput - The return type for the queryIncidentAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QueryIncidentAnomaliesInputSchema = z.object({
  query: z
    .string()
    .describe('The natural language question about security concerns in a specific zone.'),
});
export type QueryIncidentAnomaliesInput = z.infer<
  typeof QueryIncidentAnomaliesInputSchema
>;

const QueryIncidentAnomaliesOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A summary of AI-detected incident anomalies in the specified zone.'
    ),
  hasAnomalies: z
    .boolean()
    .describe(
      'Whether or not there are incident anomalies according to the AI.'
    ),
});
export type QueryIncidentAnomaliesOutput = z.infer<
  typeof QueryIncidentAnomaliesOutputSchema
>;

export async function queryIncidentAnomalies(
  input: QueryIncidentAnomaliesInput
): Promise<QueryIncidentAnomaliesOutput> {
  return queryIncidentAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'queryIncidentAnomaliesPrompt',
  input: {schema: QueryIncidentAnomaliesInputSchema},
  output: {schema: QueryIncidentAnomaliesOutputSchema},
  prompt: `You are an AI assistant designed to summarize security concerns in specific zones based on AI-detected incident anomalies.

  Given the following question: {{{query}}}

  Provide a concise summary of any incident anomalies detected by AI. Determine whether there are anomalies and set the "hasAnomalies" field appropriately. The summary should be comprehensive but brief.  If no anomalies exist, respond that there are no anomalies.
  `,
});

const queryIncidentAnomaliesFlow = ai.defineFlow(
  {
    name: 'queryIncidentAnomaliesFlow',
    inputSchema: QueryIncidentAnomaliesInputSchema,
    outputSchema: QueryIncidentAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
