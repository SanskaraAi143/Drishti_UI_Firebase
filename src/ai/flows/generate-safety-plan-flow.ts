/**
 * @fileOverview An AI flow for generating event safety plan recommendations.
 *
 * - generateSafetyPlan - A function that takes event details and returns AI-powered recommendations.
 * - GenerateSafetyPlanInput - The input type for the generateSafetyPlan function.
 * - GenerateSafetyPlanOutput - The return type for the generateSafetyPlan function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSafetyPlanInputSchema = z.object({
  eventName: z.string().describe('The name of the event.'),
  eventType: z.string().describe('The type of event (e.g., Music Festival, Political Rally).'),
  peakAttendance: z.number().describe('The expected peak attendance number.'),
  vipPresence: z.boolean().describe('Whether high-profile individuals (VIPs) will be present.'),
  eventSentiment: z.string().describe('The overall public sentiment towards the event (e.g., Celebratory, Controversial).'),
  securityConcerns: z.array(z.string()).describe('A list of primary, anticipated security concerns.'),
});
export type GenerateSafetyPlanInput = z.infer<typeof GenerateSafetyPlanInputSchema>;

const RecommendationSchema = z.object({
  title: z.string().describe('A short, headline-style title for the recommendation.'),
  description: z.string().describe('A detailed paragraph explaining the recommendation and its rationale.'),
  action: z.string().optional().describe('A suggested, brief call-to-action for the user, like "Highlight Choke Points" or "View VIP Routes".'),
});

const GenerateSafetyPlanOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema).describe('A list of AI-generated safety and security recommendations.'),
});
export type GenerateSafetyPlanOutput = z.infer<typeof GenerateSafetyPlanOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateSafetyPlanPrompt',
  input: { schema: GenerateSafetyPlanInputSchema },
  output: { schema: GenerateSafetyPlanOutputSchema },
  prompt: `You are an expert security planner for large-scale public events, with decades of experience in law enforcement and private security. Your name is "Drishti AI".

Your task is to analyze the provided event intelligence and generate a set of robust, actionable recommendations for the event planner. The recommendations should be specific, tactical, and directly address the potential risks identified in the intelligence report.

Analyze the following event data:
- Event Name: {{{eventName}}}
- Event Type: {{{eventType}}}
- Peak Attendance: {{{peakAttendance}}}
- VIP Presence: {{#if vipPresence}}Yes{{else}}No{{/if}}
- Event Sentiment: {{{eventSentiment}}}
- Primary Security Concerns: {{#each securityConcerns}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}

Based on this data, generate a list of 3-5 critical recommendations. For each recommendation, provide a clear title, a detailed description of what needs to be done and why, and a brief, actionable suggestion for the user.

Example Recommendations:
- If VIP Presence is Yes, suggest 360-degree camera coverage for all VIP routes and safe zones. Your action could be "Highlight VIP Routes".
- If a security concern is 'Crowd Control & Surge Risk', recommend placing barricades for serpentine queues and identify potential choke points. Your action could be "Highlight Choke Points".
- If event sentiment is 'Controversial' or 'High-Tension', recommend establishing clear buffer zones and monitoring social media for threats. Your action could be "Show Buffer Zone Example".
- For a 'Music Festival' with high attendance, suggest placement of multiple First Aid tents and clear signage for medical emergencies. Your action could be "Suggest Medical Tent Locations".

Focus on providing practical advice that a planner can immediately implement on the map. Frame your response as a security expert giving professional advice.`,
});

const generateSafetyPlanFlow = ai.defineFlow(
  {
    name: 'generateSafetyPlanFlow',
    inputSchema: GenerateSafetyPlanInputSchema,
    outputSchema: GenerateSafetyPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function generateSafetyPlan(
  input: GenerateSafetyPlanInput
): Promise<GenerateSafetyPlanOutput> {
  return generateSafetyPlanFlow(input);
}
