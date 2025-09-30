<script lang="ts">
  import { convex } from '$lib/convex';
  import { api } from '$lib/convex';

  export let sessionId: string; // Convex Id<'workoutSessions'> as string
  export let exerciseId: string; // Convex Id<'exercises'> as string
  export let setIndex: number; // 0-based index
  export let disabled: boolean = false;

  let statusMsg = '';
  let submitting = false;

  async function mark(category: 'easy' | 'moderate' | 'hard') {
    if (disabled || submitting) return;
    statusMsg = '';
    submitting = true;
    try {
      const res = await convex.mutation(api.functions.performance.logSetRPE, {
        sessionId: sessionId as any,
        exerciseId: exerciseId as any,
        setIndex,
        category,
      });
      statusMsg = res?.created ? 'Logged.' : 'Updated.';
    } catch (e: any) {
      statusMsg = e?.message || 'Failed to log RPE.';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="flex items-center gap-2">
  <button class="px-3 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50" on:click={() => mark('easy')} disabled={disabled || submitting} aria-label="End set as easy">Easy</button>
  <button class="px-3 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50" on:click={() => mark('moderate')} disabled={disabled || submitting} aria-label="End set as moderate">Moderate</button>
  <button class="px-3 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50" on:click={() => mark('hard')} disabled={disabled || submitting} aria-label="End set as hard">Hard</button>
  {#if statusMsg}
    <span class="text-xs text-gray-500 ml-2">{statusMsg}</span>
  {/if}
</div>

<style>
  button { transition: background-color .15s ease; }
</style>
