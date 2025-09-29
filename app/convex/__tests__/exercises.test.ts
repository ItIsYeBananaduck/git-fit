import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../_generated/api.js';
import schema from '../schema.js';

// Mock data for testing
const mockExercises = [
    {
        id: 'ex1',
        name: 'Push Up',
        force: 'push',
        level: 'beginner',
        mechanic: 'compound',
        equipment: 'body only',
        primaryMuscles: ['chest', 'triceps'],
        secondaryMuscles: ['shoulders'],
        instructions: ['Start in plank position', 'Lower body', 'Push back up'],
        category: 'strength',
        images: ['pushup1.jpg', 'pushup2.jpg']
    },
    {
        id: 'ex2',
        name: 'Dumbbell Bench Press',
        force: 'push',
        level: 'intermediate',
        mechanic: 'compound',
        equipment: 'dumbbell',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps', 'shoulders'],
        instructions: ['Lie on bench', 'Hold dumbbells', 'Press up'],
        category: 'strength',
        images: ['bench1.jpg', 'bench2.jpg']
    },
    {
        id: 'ex1', // Duplicate ID for testing
        name: 'Push Up Variation',
        force: 'push',
        level: 'intermediate',
        mechanic: 'compound',
        equipment: 'body only',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps'],
        instructions: ['Modified push up'],
        category: 'strength',
        images: ['pushup3.jpg']
    }
];

describe('exercises backend', () => {
    let t: any;

    beforeEach(() => {
        t = convexTest(schema);
    });

    describe('importExercises', () => {
        it('should import exercises without duplicates', async () => {
            const result = await t.mutation(api.functions.exercises.importExercises, {
                exercises: mockExercises
            });

            expect(result.success).toBe(true);
            expect(result.imported).toBe(2); // Should skip the duplicate
            expect(result.total).toBe(3);
            expect(result.errors).toHaveLength(0);

            // Verify exercises were inserted
            const exercises = await t.query(api.functions.exercises.getExercises, {});
            expect(exercises).toHaveLength(2);

            // Verify duplicate was skipped
            const pushUpExercises = exercises.filter((ex: any) => ex.name === 'Push Up');
            expect(pushUpExercises).toHaveLength(1);
        });

        it('should handle invalid exercise data gracefully', async () => {
            const invalidExercises = [
                {
                    id: 'invalid1',
                    name: 'Invalid Exercise',
                    // Missing required fields
                    primaryMuscles: [],
                    secondaryMuscles: [],
                    instructions: [],
                    category: 'strength',
                    images: []
                }
            ];

            // Mock database error
            const originalInsert = t.db.insert;
            t.db.insert = vi.fn().mockRejectedValue(new Error('Database error'));

            const result = await t.mutation(api.functions.exercises.importExercises, {
                exercises: invalidExercises
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.imported).toBe(0);

            // Restore original function
            t.db.insert = originalInsert;
        });

        it('should generate equipment recommendations for each exercise', async () => {
            const result = await t.mutation(api.functions.exercises.importExercises, {
                exercises: [mockExercises[1]] // Dumbbell exercise
            });

            expect(result.success).toBe(true);

            // Get the imported exercise
            const exercises = await t.query(api.functions.exercises.getExercises, {
                equipment: 'dumbbell'
            });

            expect(exercises).toHaveLength(1);
            const exercise = exercises[0];

            // Check equipment recommendations were generated
            expect(exercise.alternativeEquipment).toContain('Resistance Bands');
            expect(exercise.alternativeEquipment).toContain('Kettlebells');
            expect(exercise.recommendedMachines).toContain('Adjustable Dumbbells');
        });

        it('should skip exercises that already exist', async () => {
            // First import
            await t.mutation(api.functions.exercises.importExercises, {
                exercises: [mockExercises[0]]
            });

            // Second import with same exercise
            const result = await t.mutation(api.functions.exercises.importExercises, {
                exercises: [mockExercises[0]]
            });

            expect(result.success).toBe(true);
            expect(result.imported).toBe(0); // Should skip existing
            expect(result.total).toBe(1);

            // Verify only one exercise exists
            const exercises = await t.query(api.functions.exercises.getExercises, {});
            expect(exercises).toHaveLength(1);
        });
    });

    describe('getEquipmentRecommendations', () => {
        // Test the internal function through importExercises since it's not exported

        it('should recommend equipment for dumbbell exercises', async () => {
            await t.mutation(api.functions.exercises.importExercises, {
                exercises: [mockExercises[1]] // Dumbbell exercise
            });

            const exercises = await t.query(api.functions.exercises.getExercises, {
                equipment: 'dumbbell'
            });

            const exercise = exercises[0];
            expect(exercise.recommendedMachines).toEqual([
                'Adjustable Dumbbells',
                'Fixed Weight Dumbbells',
                'Olympic Dumbbells'
            ]);
            expect(exercise.alternativeEquipment).toEqual([
                'Resistance Bands',
                'Kettlebells',
                'Cable Machine',
                'Barbell'
            ]);
        });

        it('should recommend equipment for bodyweight exercises', async () => {
            await t.mutation(api.functions.exercises.importExercises, {
                exercises: [mockExercises[0]] // Body only exercise
            });

            const exercises = await t.query(api.functions.exercises.getExercises, {
                equipment: 'body only'
            });

            const exercise = exercises[0];
            expect(exercise.recommendedMachines).toEqual([
                'Pull-up Bar',
                'Dip Station',
                'Exercise Mat',
                'Suspension Trainer'
            ]);
            expect(exercise.alternativeEquipment).toEqual([
                'Resistance Bands',
                'Light Weights',
                'Stability Ball'
            ]);
        });

        it('should handle unknown equipment types', async () => {
            const unknownEquipmentExercise = {
                ...mockExercises[0],
                id: 'unknown1',
                equipment: 'unknown-equipment'
            };

            await t.mutation(api.functions.exercises.importExercises, {
                exercises: [unknownEquipmentExercise]
            });

            const exercises = await t.query(api.functions.exercises.getExercises, {
                equipment: 'unknown-equipment'
            });

            const exercise = exercises[0];
            expect(exercise.recommendedMachines).toEqual(['Basic Gym Equipment']);
            expect(exercise.alternativeEquipment).toEqual(['Bodyweight Alternative']);
        });
    });

    describe('getExercises', () => {
        beforeEach(async () => {
            // Import test exercises
            await t.mutation(api.functions.exercises.importExercises, {
                exercises: mockExercises.slice(0, 2) // First two exercises
            });
        });

        it('should return all exercises when no filters', async () => {
            const exercises = await t.query(api.functions.exercises.getExercises, {});
            expect(exercises).toHaveLength(2);
        });

        it('should filter by category', async () => {
            const exercises = await t.query(api.functions.exercises.getExercises, {
                category: 'strength'
            });
            expect(exercises).toHaveLength(2);
            expect(exercises.every((ex: any) => ex.category === 'strength')).toBe(true);
        });

        it('should filter by level', async () => {
            const beginnerExercises = await t.query(api.functions.exercises.getExercises, {
                level: 'beginner'
            });
            expect(beginnerExercises).toHaveLength(1);
            expect(beginnerExercises[0].name).toBe('Push Up');

            const intermediateExercises = await t.query(api.functions.exercises.getExercises, {
                level: 'intermediate'
            });
            expect(intermediateExercises).toHaveLength(1);
            expect(intermediateExercises[0].name).toBe('Dumbbell Bench Press');
        });

        it('should filter by equipment', async () => {
            const bodyweightExercises = await t.query(api.functions.exercises.getExercises, {
                equipment: 'body only'
            });
            expect(bodyweightExercises).toHaveLength(1);
            expect(bodyweightExercises[0].equipment).toBe('body only');

            const dumbbellExercises = await t.query(api.functions.exercises.getExercises, {
                equipment: 'dumbbell'
            });
            expect(dumbbellExercises).toHaveLength(1);
            expect(dumbbellExercises[0].equipment).toBe('dumbbell');
        });

        it('should filter by muscle group', async () => {
            const chestExercises = await t.query(api.functions.exercises.getExercises, {
                muscleGroup: 'chest'
            });
            expect(chestExercises).toHaveLength(2);
            expect(chestExercises.every((ex: any) =>
                ex.primaryMuscles.includes('chest') || ex.secondaryMuscles.includes('chest')
            )).toBe(true);

            const tricepsExercises = await t.query(api.functions.exercises.getExercises, {
                muscleGroup: 'triceps'
            });
            expect(tricepsExercises).toHaveLength(2);
        });

        it('should search by name and muscle groups', async () => {
            const pushUpSearch = await t.query(api.functions.exercises.getExercises, {
                search: 'push'
            });
            expect(pushUpSearch).toHaveLength(1);
            expect(pushUpSearch[0].name).toBe('Push Up');

            const chestSearch = await t.query(api.functions.exercises.getExercises, {
                search: 'chest'
            });
            expect(chestSearch).toHaveLength(2);
        });

        it('should limit results', async () => {
            const limitedExercises = await t.query(api.functions.exercises.getExercises, {
                limit: 1
            });
            expect(limitedExercises).toHaveLength(1);
        });

        it('should combine multiple filters', async () => {
            const filteredExercises = await t.query(api.functions.exercises.getExercises, {
                category: 'strength',
                level: 'beginner',
                equipment: 'body only',
                muscleGroup: 'chest'
            });
            expect(filteredExercises).toHaveLength(1);
            expect(filteredExercises[0].name).toBe('Push Up');
        });
    });

    describe('getExerciseWithRecommendations', () => {
        beforeEach(async () => {
            // Import exercises and initialize equipment recommendations
            await t.mutation(api.functions.exercises.importExercises, {
                exercises: [mockExercises[1]] // Dumbbell exercise
            });
            await t.mutation(api.functions.exercises.initializeEquipmentRecommendations, {});
        });

        it('should return exercise with equipment recommendations', async () => {
            const exercise = await t.query(api.functions.exercises.getExerciseWithRecommendations, {
                exerciseId: 'ex2'
            });

            expect(exercise).toBeDefined();
            expect(exercise.name).toBe('Dumbbell Bench Press');
            expect(exercise.equipmentRecommendation).toBeDefined();
            expect(exercise.equipmentRecommendation.equipmentType).toBe('dumbbell');
        });

        it('should return null for non-existent exercise', async () => {
            const exercise = await t.query(api.functions.exercises.getExerciseWithRecommendations, {
                exerciseId: 'non-existent'
            });

            expect(exercise).toBeNull();
        });
    });

    describe('initializeEquipmentRecommendations', () => {
        it('should initialize equipment recommendations', async () => {
            const result = await t.mutation(api.functions.exercises.initializeEquipmentRecommendations, {});

            expect(result.success).toBe(true);
            expect(result.initialized).toBe(6); // Number of equipment types

            // Verify recommendations were created
            const dumbbellRec = await t.db
                .query('equipmentRecommendations')
                .withIndex('by_equipment_type', (q) => q.eq('equipmentType', 'dumbbell'))
                .first();

            expect(dumbbellRec).toBeDefined();
            expect(dumbbellRec.primaryMachines).toContain('Adjustable Dumbbells');
            expect(dumbbellRec.homeAlternatives).toContain('Resistance Bands');
        });

        it('should not duplicate existing recommendations', async () => {
            // First initialization
            await t.mutation(api.functions.exercises.initializeEquipmentRecommendations, {});

            // Second initialization
            const result = await t.mutation(api.functions.exercises.initializeEquipmentRecommendations, {});

            expect(result.success).toBe(true);

            // Verify no duplicates
            const allRecs = await t.db.query('equipmentRecommendations').collect();
            const dumbbellRecs = allRecs.filter(rec => rec.equipmentType === 'dumbbell');
            expect(dumbbellRecs).toHaveLength(1);
        });
    });
});
