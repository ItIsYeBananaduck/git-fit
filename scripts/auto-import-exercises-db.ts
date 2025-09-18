// scripts/auto-import-exercises-db.ts
// Script to import exercises from the open-source exercise-db dataset (GitHub)

import fetch from 'node-fetch';
import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';
dotenv.config();

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;
const EXERCISE_DB_URL = 'https://raw.githubusercontent.com/wrkout/exercise-db/master/exercises.json';

if (!CONVEX_URL || !CONVEX_DEPLOY_KEY) {
    console.error('Missing required environment variables.');
    process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL, CONVEX_DEPLOY_KEY);

async function fetchExercises() {
    const res = await fetch(EXERCISE_DB_URL);
    if (!res.ok) throw new Error('Failed to fetch exercises from exercise-db');
    return res.json();
}

async function importExercisesToConvex(exercises) {
    // Map exercise-db format to your Convex schema
    const mapped = exercises.map((ex) => ({
        id: ex.id || ex.uuid || ex.name, // fallback if no id
        name: ex.name,
        force: ex.force || undefined,
        level: ex.level || 'beginner',
        mechanic: ex.mechanic || undefined,
        equipment: ex.equipment || undefined,
        primaryMuscles: ex.primaryMuscles || ex.target ? [ex.target] : [],
        secondaryMuscles: ex.secondaryMuscles || [],
        instructions: ex.instructions ? (Array.isArray(ex.instructions) ? ex.instructions : [ex.instructions]) : [],
        category: ex.bodyPart || ex.category || 'General',
        images: ex.images || (ex.gifUrl ? [ex.gifUrl] : []),
    }));
    const result = await convex.mutation('exercises:importExercises', { exercises: mapped });
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
