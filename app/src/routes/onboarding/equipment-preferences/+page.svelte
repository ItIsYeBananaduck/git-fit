<script lang="ts">
	import EquipmentPreferenceStep from '$lib/components/onboarding/EquipmentPreferenceStep.svelte';
	import { goto } from '$app/navigation';
	import { getAuthUser } from '$lib/stores/auth';
	import { api } from '$lib/convex/_generated/api';

	let user: any = null;

	async function handleSubmit(event: CustomEvent) {
		const { equipment, preferences } = event.detail;
		user = await getAuthUser();
		if (!user) {
			goto('/auth/login');
			return;
		}
		// Save to user config (backend API call)
		await api.userConfigs.setUserConfig({
			userId: user._id,
			configJson: JSON.stringify({ equipment, preferences })
		});
		goto('/onboarding/complete');
	}
</script>

<EquipmentPreferenceStep on:submit={handleSubmit} />
