/**
 * @fileOverview A flow for finding a person using an image.
 *
 * - findPerson - A function that handles finding a person from an image.
 * - FindPersonInput - The input type for the findPerson function.
 * - FindPersonOutput - The return type for the findPerson function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FindPersonInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person to find, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  name: z.string().optional().describe('The name of the person to find.'),
});
export type FindPersonInput = z.infer<typeof FindPersonInputSchema>;

const FindPersonOutputSchema = z.object({
  found: z.boolean().describe('Whether a matching person was found.'),
  message: z.string().describe('A message describing the result.'),
  lastSeen: z
    .object({
      location: z.string().describe('The last known location of the person.'),
      timestamp: z.string().describe('The timestamp of the last sighting.'),
      cameraId: z.string().describe('The ID of the camera that last saw the person.'),
    })
    .optional(),
});
export type FindPersonOutput = z.infer<typeof FindPersonOutputSchema>;

// This is where you would implement your backend logic to search for the person.
// For now, it returns a mock response.
async function performFaceSearch(input: FindPersonInput): Promise<FindPersonOutput> {
  console.log('Performing face search for:', input.name || 'Unknown');
  // Mock finding a person
  const found = Math.random() > 0.3; // 70% chance of finding someone
  if (found) {
    return {
      found: true,
      message: `We have a potential match for ${input.name || 'the person'}.`,
      lastSeen: {
        location: 'Main Stage',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        cameraId: 'cam-04',
      },
    };
  } else {
    return {
      found: false,
      message: `We could not find a match for ${input.name || 'the person'}. We will continue to monitor the feeds.`,
    };
  }
}


const findPersonFlow = ai.defineFlow(
  {
    name: 'findPersonFlow',
    inputSchema: FindPersonInputSchema,
    outputSchema: FindPersonOutputSchema,
  },
  async (input) => {
    // In a real implementation, you would call your face detection/matching service here.
    // The prompt is here just to demonstrate the flow structure, but the core logic
    // would be in a custom function call.
    return await performFaceSearch(input);
  }
);


export async function findPerson(
  input: FindPersonInput
): Promise<FindPersonOutput> {
  return findPersonFlow(input);
}
