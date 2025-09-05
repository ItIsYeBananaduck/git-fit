<script lang="ts">
        import { createEventDispatcher } from 'svelte';
        import { getEquipmentRecommendations } from '$lib/data/equipment';

        export let exerciseName: string = '';
        export let primaryEquipment: string = '';
        export let recommendedMachines: string[] = [];
        export let alternativeEquipment: string[] = [];
        export let selectedEquipment: string = '';
        export let userPreferences: string[] = [];

        const dispatch = createEventDispatcher();

        let showAlternatives = false;
        let customEquipment = '';

        // Auto-select recommended equipment based on user preferences
        $: {
                if (!selectedEquipment && recommendedMachines.length > 0) {
                        // Try to find user's preferred equipment first
                        const preferred = recommendedMachines.find(machine => 
                                userPreferences.some(pref => machine.toLowerCase().includes(pref.toLowerCase()))
                        );
                        selectedEquipment = preferred || recommendedMachines[0];
                }
        }

        function selectEquipment(equipment: string) {
                selectedEquipment = equipment;
                dispatch('equipmentSelected', { 
                        exerciseName, 
                        equipment,
                        isAlternative: !recommendedMachines.includes(equipment)
                });
        }

        function addCustomEquipment() {
                if (customEquipment.trim()) {
                        selectEquipment(customEquipment.trim());
                        customEquipment = '';
                }
        }

        function getEquipmentIcon(equipment: string): string {
                const lower = equipment.toLowerCase();
                if (lower.includes('dumbbell')) return '🏋️';
                if (lower.includes('barbell')) return '🏋️‍♂️';
                if (lower.includes('machine')) return '⚙️';
                if (lower.includes('cable')) return '🔗';
                if (lower.includes('kettlebell')) return '⚖️';
                if (lower.includes('band')) return '🔴';
                if (lower.includes('ball')) return '⚽';
                if (lower.includes('bar') && lower.includes('pull')) return '🤸';
                return '💪';
        }

        function getEquipmentBadgeColor(equipment: string): string {
                if (recommendedMachines.includes(equipment)) return 'bg-green-100 text-green-800 border-green-200';
                if (alternativeEquipment.includes(equipment)) return 'bg-blue-100 text-blue-800 border-blue-200';
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-3">
                <h3 class="font-medium text-gray-900">Equipment for {exerciseName}</h3>
                <button
                        on:click={() => showAlternatives = !showAlternatives}
                        class="text-sm text-blue-600 hover:text-blue-700"
                >
                        {showAlternatives ? 'Hide' : 'Show'} Alternatives
                </button>
        </div>

        <!-- Primary Equipment Recommendations -->
        <div class="space-y-3">
                <div>
                        <h4 class="text-sm font-medium text-gray-700 mb-2">
                                Recommended ({primaryEquipment || 'Equipment'})
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {#each recommendedMachines as machine}
                                        <button
                                                on:click={() => selectEquipment(machine)}
                                                class="flex items-center p-3 rounded-lg border transition-all {selectedEquipment === machine 
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
                                        >
                                                <span class="text-lg mr-2">{getEquipmentIcon(machine)}</span>
                                                <div class="text-left">
                                                        <div class="font-medium text-gray-900 text-sm">{machine}</div>
                                                        {#if userPreferences.some(pref => machine.toLowerCase().includes(pref.toLowerCase()))}
                                                                <div class="text-xs text-green-600">Your preference</div>
                                                        {/if}
                                                </div>
                                                {#if selectedEquipment === machine}
                                                        <span class="ml-auto text-primary">✓</span>
                                                {/if}
                                        </button>
                                {/each}
                        </div>
                </div>

                <!-- Alternative Equipment -->
                {#if showAlternatives && alternativeEquipment.length > 0}
                        <div>
                                <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                        Alternative Options
                                        <span class="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                Can substitute
                                        </span>
                                </h4>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {#each alternativeEquipment as alternative}
                                                <button
                                                        on:click={() => selectEquipment(alternative)}
                                                        class="flex items-center p-3 rounded-lg border transition-all {selectedEquipment === alternative 
                                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
                                                >
                                                        <span class="text-lg mr-2">{getEquipmentIcon(alternative)}</span>
                                                        <div class="text-left">
                                                                <div class="font-medium text-gray-900 text-sm">{alternative}</div>
                                                                <div class="text-xs text-blue-600">Alternative</div>
                                                        </div>
                                                        {#if selectedEquipment === alternative}
                                                                <span class="ml-auto text-blue-600">✓</span>
                                                        {/if}
                                                </button>
                                        {/each}
                                </div>
                        </div>
                {/if}

                <!-- Custom Equipment Input -->
                {#if showAlternatives}
                        <div>
                                <h4 class="text-sm font-medium text-gray-700 mb-2">Custom Equipment</h4>
                                <div class="flex gap-2">
                                        <input
                                                type="text"
                                                bind:value={customEquipment}
                                                placeholder="Enter custom equipment..."
                                                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                                on:keydown={(e) => e.key === 'Enter' && addCustomEquipment()}
                                        />
                                        <button
                                                on:click={addCustomEquipment}
                                                disabled={!customEquipment.trim()}
                                                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                                Add
                                        </button>
                                </div>
                        </div>
                {/if}
        </div>

        <!-- Selected Equipment Display -->
        {#if selectedEquipment}
                <div class="mt-4 pt-4 border-t border-gray-200">
                        <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                        <span class="text-lg mr-2">{getEquipmentIcon(selectedEquipment)}</span>
                                        <div>
                                                <div class="font-medium text-gray-900">Selected: {selectedEquipment}</div>
                                                <div class="text-sm text-gray-600">
                                                        {recommendedMachines.includes(selectedEquipment) ? 'Recommended' : 'Alternative'} equipment
                                                </div>
                                        </div>
                                </div>
                                <span class="px-3 py-1 rounded-full text-xs font-medium border {getEquipmentBadgeColor(selectedEquipment)}">
                                        {recommendedMachines.includes(selectedEquipment) ? 'Optimal' : 'Alternative'}
                                </span>
                        </div>
                </div>
        {/if}
</div>