<script>
	import AliceAvatar from '$lib/components/AliceAvatar.svelte';
</script>

<h1>🎯 Alice AI Test Page</h1>
<p>If you can see this, the basic routing is working!</p>

<div style="border: 2px solid #00bfff; padding: 20px; margin: 20px; background: #f0f9ff;">
	<h2>✅ Server Status</h2>
	<p>✅ Vite development server running</p>
	<p>✅ SvelteKit routing functional</p>
	<p>🔧 Testing Alice AI integration...</p>
</div>

<div style="border: 2px solid #ff69b4; padding: 20px; margin: 20px; background: #fff0f5;">
	<h2>🤖 Alice Avatar Test</h2>
	<div style="width: 200px; height: 200px; border: 2px solid #8b5cf6; display: flex; align-items: center; justify-content: center;">
		<AliceAvatar bodyColor="#8b5cf6" strain={50} heartRate={75} expression="calm" size={180} />
	</div>
	<p>Alice should appear above in a purple glowing avatar.</p>
</div>

<style>
	body {
		font-family: Arial, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		margin: 0;
		padding: 20px;
	}
	h1 {
		color: #00bfff;
		text-align: center;
	}
</style>
