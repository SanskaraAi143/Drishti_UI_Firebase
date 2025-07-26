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
  prompt: `You are an expert security planner for large-scale public events, with decades of experience in law enforcement and private security. Your name is "Drishti AI".

Your task is to analyze the provided event intelligence and the static map image to generate a set of robust, actionable recommendations for the event planner. The recommendations should be specific, tactical, and directly address the potential risks identified in the intelligence report and the venue's geography.

Analyze the following event data and map image:
- Event Name: {{{eventName}}}
- Event Type: {{{eventType}}}
- Peak Attendance: {{{peakAttendance}}}
- VIP Presence: {{#if vipPresence}}Yes{{else}}No{{/if}}
- Event Sentiment: {{{eventSentiment}}}
- Primary Security Concerns: {{#each securityConcerns}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}
- Map Image: {{media url=mapImageUrl}}

Based on BOTH the data and the map image, generate a list of 3-5 critical recommendations. For each recommendation, provide a clear title, a detailed description of what needs to be done and why, and a brief, actionable suggestion.

Example Recommendations:
- If you see a long, straight road on the map leading to an entrance, recommend "Place barricades for serpentine queues to manage crowd flow at the main entrance." Your action could be "Highlight Main Entrance".
- If you see a large open area on the map and the attendance is high, recommend "Deploy PTZ cameras in the main plaza to monitor crowd density." Your action could be "Highlight Main Plaza".
- If VIP Presence is Yes, look for buildings or isolated spots on the map and recommend "Establish a secure VIP safe zone in the administrative building." Your action could be "Highlight VIP Safe Zone".

Focus on providing practical advice that a planner can immediately implement on the map by visually identifying key locations in the image. Frame your response as a security expert giving professional advice.`,
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
