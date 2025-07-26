
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

// This function now calls the external endpoint
async function performFaceSearch(input: FindPersonInput): Promise<FindPersonOutput> {
  console.log('Sending face search request for:', input.name || 'Unknown');
  const endpoint = 'http://localhost:5000/lost-find';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: input.name,
        image: input.photoDataUri, // Send the data URI
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Endpoint request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    // Adapt the response from the endpoint to the FindPersonOutputSchema
    // This assumes the endpoint returns a similar structure.
    // You might need to adjust this mapping based on the actual endpoint response.
    return {
      found: result.found,
      message: result.message,
      lastSeen: result.lastSeen ? {
        location: result.lastSeen.location,
        timestamp: result.lastSeen.timestamp,
        cameraId: result.lastSeen.cameraId,
      } : undefined,
    };
  } catch (error: any) {
    console.error('Error calling face search endpoint:', error);
    return {
      found: false,
      message: `Failed to connect to the search service. ${error.message}`,
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
    // The core logic is now to call the external endpoint.
    return await performFaceSearch(input);
  }
);


export async function findPerson(
  input: FindPersonInput
): Promise<FindPersonOutput> {
  return findPersonFlow(input);
}
