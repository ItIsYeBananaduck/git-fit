<script lang="ts">
  import { authState, authActions } from "../lib/convexAuth";

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    await authActions.signIn("password", formData);
  }
</script>

{#if $authState.user}
  <div class="p-4 border rounded-lg">
    <h2 class="text-lg font-semibold mb-2">Welcome!</h2>
    <p class="mb-4">You are signed in as: {$authState.user.email || $authState.user.name}</p>
    <button 
      on:click={() => authActions.signOut()}
      class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Sign Out
    </button>
  </div>
{:else}
  <div class="p-4 border rounded-lg">
    <h2 class="text-lg font-semibold mb-4">Sign In</h2>
    <form on:submit={handleSubmit} class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          class="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          class="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div class="flex gap-2">
        <button
          type="submit"
          name="flow"
          value="signIn"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sign In
        </button>
        <button
          type="submit"
          name="flow"
          value="signUp"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Sign Up
        </button>
      </div>
    </form>
  </div>
{/if}