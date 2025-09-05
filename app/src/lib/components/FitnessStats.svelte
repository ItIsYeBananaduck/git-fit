<script lang="ts">
        export let fitnessData: any;
        
        const stats = [
                {
                        label: 'Steps Today',
                        value: fitnessData.todaySteps.toLocaleString(),
                        color: 'text-blue-600',
                        bgColor: 'bg-blue-50'
                },
                {
                        label: 'Avg Heart Rate',
                        value: `${fitnessData.avgHeartRate} bpm`,
                        color: 'text-red-600',
                        bgColor: 'bg-red-50'
                },
                {
                        label: 'Calories Burned',
                        value: fitnessData.caloriesBurned.toLocaleString(),
                        color: 'text-orange-600',
                        bgColor: 'bg-orange-50'
                },
                {
                        label: 'Last Workout',
                        value: new Date(fitnessData.lastWorkout).toLocaleDateString(),
                        color: 'text-green-600',
                        bgColor: 'bg-green-50'
                }
        ];
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {#each stats as stat}
                <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div class="flex items-center">
                                <div class="flex-shrink-0">
                                        <div class="w-12 h-12 {stat.bgColor} rounded-lg flex items-center justify-center">
                                                <div class="w-6 h-6 rounded-full {stat.color.replace('text-', 'bg-')}"></div>
                                        </div>
                                </div>
                                <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">{stat.label}</p>
                                        <p class="text-xl font-semibold {stat.color}">{stat.value}</p>
                                </div>
                        </div>
                </div>
        {/each}
</div>