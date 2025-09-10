<script lang="ts">
        import { Activity, Dumbbell, Zap, Clock } from 'lucide-svelte';
        
        export let workout: any;

        function getDifficultyColor(difficulty: string) {
                switch (difficulty) {
                        case 'beginner': return 'bg-green-100 text-green-800';
                        case 'intermediate': return 'bg-yellow-100 text-yellow-800';
                        case 'advanced': return 'bg-red-100 text-red-800';
                        default: return 'bg-gray-100 text-gray-800';
                }
        }

        function getTypeIcon(type: string) {
                switch (type) {
                        case 'cardio': return Activity;
                        case 'strength': return Dumbbell;
                        case 'flexibility': return Activity;
                        case 'hiit': return Zap;
                        default: return Dumbbell;
                }
        }
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div class="flex items-start justify-between mb-4">
                <div class="flex items-center">
                        <div class="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                                <svelte:component this={getTypeIcon(workout.type)} size={20} class="text-primary" />
                        </div>
                        <div>
                                <h3 class="font-semibold text-gray-900">{workout.name}</h3>
                                <div class="flex items-center mt-1 space-x-2">
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getDifficultyColor(workout.difficulty)}">
                                                {workout.difficulty}
                                        </span>
                                </div>
                        </div>
                </div>
        </div>

        <div class="space-y-3 mb-6">
                <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center text-gray-600">
                                <Clock size={16} class="mr-2" />
                                <span>Duration</span>
                        </div>
                        <span class="font-medium">{workout.duration} minutes</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Exercises</span>
                        <span class="font-medium">{workout.exercises}</span>
                </div>
        </div>

        <button class="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Start Workout
        </button>
</div>