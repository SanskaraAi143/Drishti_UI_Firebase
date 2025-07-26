/**
 * @fileOverview A flow for summarizing a list of incidents.
 *
 * - summarizeIncidents - A function that takes incidents and returns a summary.
 * - SummarizeIncidentsInput - The input type for the summarizeIncidents function.
 * - SummarizeIncidentsOutput - The return type for the summarizeIncidents function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Incident } from '@/lib/types';

const IncidentSchema = z.object({
    id: z.string(),
    type: z.enum(['CrowdSurge', 'Altercation', 'Medical', 'UnattendedObject']),
    description: z.string(),
    timestamp: z.string().describe("The ISO 8601 timestamp of the incident."),
    location: z.object({ lat: z.number(), lng: z.number() }),
    severity: z.enum(['Low', 'Medium', 'High']),
    source: z.string(),
});

const SummarizeIncidentsInputSchema = z.object({
  incidents: z.array(IncidentSchema).describe('A list of incidents to be summarized.'),
});
export type SummarizeIncidentsInput = z.infer<typeof SummarizeIncidentsInputSchema>;

const SummarizeIncidentsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the provided incidents.'),
});
export type SummarizeIncidentsOutput = z.infer<typeof SummarizeIncidentsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'summarizeIncidentsPrompt',
  input: { schema: SummarizeIncidentsInputSchema },
  output: { schema: SummarizeIncidentsOutputSchema },
  prompt: `You are a security command center AI assistant. Your task is to provide a high-level summary of the current incident landscape for the commander.

Review the following list of incidents and generate a brief, actionable summary. Focus on the most critical events, mention any emerging patterns (e.g., multiple incidents in the same zone), and provide a clear overview of the situation.

Incidents:
{{#each incidents}}
- Severity: {{this.severity}}, Type: {{this.type}}, Description: "{{this.description}}" at {{this.location.lat}},{{this.location.lng}} (Reported at: {{this.timestamp}})
{{/each}}

Generate the summary.`,
});

const summarizeIncidentsFlow = ai.defineFlow(
  {
    name: 'summarizeIncidentsFlow',
    inputSchema: SummarizeIncidentsInputSchema,
    outputSchema: SummarizeIncidentsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function summarizeIncidents(
  incidents: Incident[]
): Promise<SummarizeIncidentsOutput> {
    const flowInput = {
        incidents: incidents.map(i => ({...i, timestamp: i.timestamp.toISOString()}))
    }
    return summarizeIncidentsFlow(flowInput);
}
