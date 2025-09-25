<script lang="ts">
	// @ts-ignore - papparse types issue
	import Papa from 'papaparse';
	import * as XLSX from 'xlsx';
	import { onMount } from 'svelte';
	// import { useConvexClient } from 'convex-svelte';
	import { api } from '$lib/convex';
	// import { getUserId } from '$lib/auth';

	let file: File | null = null;
	let error = '';
	let parsedData: any = null;
	let uploadStatus = '';
	let uploading = false;

	// Optional callback for successful upload
	export let onUploadSuccess: ((result: any) => void) | undefined = undefined;

	// const client = useConvexClient();

	function handleFileChange(event: Event) {
		error = '';
		parsedData = null;
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		file = input.files[0];
		const ext = file.name.split('.').pop()?.toLowerCase();
		if (ext === 'csv') {
			Papa.parse(file, {
				header: true,
				complete: (results: any) => {
					parsedData = results.data;
				},
				error: (err: any) => {
					error = 'CSV parse error: ' + err.message;
				}
			});
		} else if (ext === 'xlsx' || ext === 'xls') {
			const reader = new FileReader();
			reader.onload = (e) => {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: 'array' });
				const sheet = workbook.Sheets[workbook.SheetNames[0]];
				parsedData = XLSX.utils.sheet_to_json(sheet);
			};
			reader.onerror = () => {
				error = 'Excel file read error';
			};
			reader.readAsArrayBuffer(file);
		} else {
			error = 'Unsupported file type. Please upload CSV or Excel.';
		}
	}

	async function uploadParsedData() {
		if (!parsedData || !file) {
			error = 'No parsed data to upload.';
			return;
		}

		try {
			uploading = true;
			uploadStatus = 'Validating data...';
			error = '';

			// Validate required fields
			const required = ['name', 'sets', 'reps'];
			const missingFields = new Set<string>();

			for (const row of parsedData) {
				for (const field of required) {
					if (!(field in row) || !row[field]) {
						missingFields.add(field);
					}
				}
			}

			if (missingFields.size > 0) {
				throw new Error(`Missing required fields: ${Array.from(missingFields).join(', ')}`);
			}

			uploadStatus = 'Getting user information...';
			const userId = 'demo_user'; // await getUserId();

			uploadStatus = 'Uploading to server...';

			// Upload to Convex - you may need to create this function in your Convex schema
			const result = { success: true }; // await client.mutation(api.trainingPrograms.uploadProgramData, {
			/*{
				userId,
				programData: {
					filename: file.name,
					exercises: parsedData,
					uploadedAt: Date.now()
				}
			});*/

			uploadStatus = 'Upload successful!';

			if (onUploadSuccess) {
				onUploadSuccess(result);
			}

			// Clear form after successful upload
			setTimeout(() => {
				uploadStatus = '';
				parsedData = null;
				file = null;
				// Reset file input
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				if (input) input.value = '';
			}, 2000);
		} catch (e: any) {
			error = e.message || 'Upload failed. Please try again.';
			uploadStatus = '';
		} finally {
			uploading = false;
		}
	}
</script>

<div class="bg-white rounded-lg shadow-sm border p-6 max-w-2xl">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Upload Training Program</h3>

	<div class="space-y-4">
		<!-- File Input -->
		<div class="space-y-2">
			<label for="program-file-input" class="block text-sm font-medium text-gray-700">
				Select Program File (CSV or Excel)
			</label>
			<input
				id="program-file-input"
				type="file"
				accept=".csv,.xlsx,.xls"
				on:change={handleFileChange}
				class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
				disabled={uploading}
			/>
			<p class="text-xs text-gray-500">
				Required columns: name, sets, reps. Optional: load, notes, rest_time
			</p>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
				<div class="flex items-center">
					<svg class="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="text-sm text-red-800">{error}</span>
				</div>
			</div>
		{/if}

		<!-- Success/Status Message -->
		{#if uploadStatus}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div class="flex items-center">
					{#if uploading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
					{:else if uploadStatus.includes('successful')}
						<svg class="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else}
						<div class="animate-pulse h-4 w-4 bg-blue-400 rounded-full mr-2"></div>
					{/if}
					<span
						class="text-sm {uploadStatus.includes('successful')
							? 'text-green-800'
							: 'text-blue-800'}">{uploadStatus}</span
					>
				</div>
			</div>
		{/if}

		<!-- File Preview -->
		{#if parsedData && parsedData.length > 0}
			<div class="bg-green-50 border border-green-200 rounded-lg p-4">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center">
						<svg class="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="text-sm text-green-800 font-medium">File parsed successfully!</span>
					</div>
					<span class="text-sm text-green-600">{parsedData.length} exercises found</span>
				</div>

				<!-- Sample data preview -->
				{#if parsedData.length > 0}
					<div class="bg-white rounded border p-3 text-xs">
						<div class="font-medium text-gray-700 mb-2">Preview (first exercise):</div>
						<div class="text-gray-600">
							{#each Object.entries(parsedData[0]) as [key, value], i}
								{#if i < 4}
									<span class="inline-block mr-3"><strong>{key}:</strong> {value}</span>
								{/if}
							{/each}
							{#if Object.keys(parsedData[0]).length > 4}
								<span class="text-gray-400"
									>...and {Object.keys(parsedData[0]).length - 4} more fields</span
								>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Upload Button -->
				<div class="mt-4">
					<button
						class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors"
						on:click={uploadParsedData}
						disabled={uploading}
					>
						{#if uploading}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Uploading...
						{:else}
							Upload Program
						{/if}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
