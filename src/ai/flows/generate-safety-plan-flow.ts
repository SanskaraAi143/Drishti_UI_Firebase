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
  mapImageUrl: z.string().describe('A static map image URL showing the event geofence.'),
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
  prompt: `You are an expert security planner AI named "Drishti AI". Your audience is busy field commanders and event planners who need immediate, actionable intelligence.
  
Your task is to analyze the provided event data and map image to generate a list of CRITICAL, CONCISE recommendations.
  
**RULES:**
- BE BRIEF. Use bullet points or very short sentences. No long paragraphs.
- FOCUS ON ACTION. The output should be tactical and to the point.
- ANALYZE THE IMAGE. Base recommendations on visible geographic features in the map image.

**Analyze this data:**
- Event Name: {{{eventName}}}
- Event Type: {{{eventType}}}
- Peak Attendance: {{{peakAttendance}}}
- VIP Presence: {{#if vipPresence}}Yes{{else}}No{{/if}}
- Event Sentiment: {{{eventSentiment}}}
- Primary Security Concerns: {{#each securityConcerns}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}
- Map Image: {{media url=mapImageUrl}}

**Generate 3-5 recommendations based on the data and map image.**

Example Output Format:
- Title: Secure Main Entrance
- Description: - High traffic area visible on map.\n- Place barricades for serpentine queues.\n- Reduces risk of crowd surge.
- Action: Highlight Main Entrance

- Title: Monitor Open Plaza
- Description: - Large open area identified on map.\n- Deploy PTZ cameras for crowd density monitoring.
- Action: Highlight Main Plaza`,
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
