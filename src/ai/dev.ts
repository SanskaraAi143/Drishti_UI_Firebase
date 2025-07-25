'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/query-incident-anomalies.ts';
import '@/ai/flows/lost-and-found-flow.ts';
