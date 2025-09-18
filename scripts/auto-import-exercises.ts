// scripts/auto-import-exercises.ts
// Script to automate import of exercises from Free Exercise Database API into Convex

import fetch from 'node-fetch';
import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';
dotenv.config();

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;
const EXERCISE_API_URL = 'https://api.api-ninjas.com/v1/exercises?limit=1000';
const EXERCISE_API_KEY = process.env.EXERCISE_API_KEY;

if (!CONVEX_URL || !CONVEX_DEPLOY_KEY || !EXERCISE_API_KEY) {
    console.error('Missing required environment variables.');
    process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL, CONVEX_DEPLOY_KEY);

async function fetchExercises() {
    const res = await fetch(EXERCISE_API_URL, {
        headers: { 'X-Api-Key': EXERCISE_API_KEY }
    });
    if (!res.ok) throw new Error('Failed to fetch exercises');
    return res.json();
}

async function importExercisesToConvex(exercises) {
    const result = await convex.mutation('exercises:importExercises', { exercises });
    return result;
}

(async () => {
    try {
        const exercises = await fetchExercises();
        const result = await importExercisesToConvex(exercises);
        console.log('Import result:', result);
    } catch (err) {
        console.error('Error importing exercises:', err);
        process.exit(1);
    }
})();
