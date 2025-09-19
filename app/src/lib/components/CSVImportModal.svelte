<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		CSVWorkoutImporter,
		type CSVImportResult,
		type CSVImportOptions
	} from '$lib/services/csvWorkoutImporter.js';
	import type { Id } from '$lib/convex/_generated/dataModel.js';

	export let userId: Id<'users'>;
	export let isOpen = false;

	const dispatch = createEventDispatcher<{
		import: CSVImportResult;
		close: void;
	}>();

	let fileInput: HTMLInputElement;
	let selectedFile: File | null = null;
	let isImporting = false;
	let importResult: CSVImportResult | null = null;
	let previewData: string[][] = [];
	let validationErrors: string[] = [];
	let validationWarnings: string[] = [];

	// Import options
	let dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'ISO' = 'MM/DD/YYYY';
	let weightUnit: 'lbs' | 'kg' = 'lbs';
	let generateInsights = true;
	let skipValidation = false;

	$: if (!isOpen) {
		resetState();
	}

	function resetState() {
		selectedFile = null;
		importResult = null;
		previewData = [];
		validationErrors = [];
		validationWarnings = [];
		if (fileInput) fileInput.value = '';
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) {
			selectedFile = null;
			previewData = [];
			return;
		}

		selectedFile = file;

		// Validate file
		try {
			const validation = await CSVWorkoutImporter.validateCSVFile(file);
			validationErrors = validation.errors;
			validationWarnings = validation.warnings;

			if (validation.valid) {
				// Preview first few rows
				const text = await file.text();
				const rows = text.split('\n').slice(0, 6);
				previewData = rows.map((row) => row.split(','));
			}
		} catch (error) {
			validationErrors = [`Failed to validate file: ${error}`];
		}
	}

	async function handleImport() {
		if (!selectedFile || validationErrors.length > 0) return;

		isImporting = true;
		importResult = null;

		try {
			const csvContent = await selectedFile.text();

			const options: CSVImportOptions = {
				userId,
				dateFormat,
				weightUnit,
				skipValidation,
				generateInsights
			};

			const importer = new CSVWorkoutImporter(options);
			const result = await importer.importFromCSV(csvContent);

			importResult = result;
			dispatch('import', result);
		} catch (error) {
			importResult = {
				success: false,
				totalRows: 0,
				importedRows: 0,
				errors: [`Import failed: ${error}`],
				warnings: [],
				insightsGenerated: 0
			};
		} finally {
			isImporting = false;
		}
	}

	function downloadTemplate() {
		const template = CSVWorkoutImporter.generateCSVTemplate();
		const blob = new Blob([template], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'workout_import_template.csv';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function closeModal() {
		dispatch('close');
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b">
				<h2 class="text-2xl font-bold text-gray-900">Import Workout Data</h2>
				<button on:click={closeModal} class="text-gray-400 hover:text-gray-600 transition-colors">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>

			<div class="p-6">
				<!-- File Selection -->
				<div class="mb-6">
					<label class="block text-sm font-medium text-gray-700 mb-2"> Select CSV File </label>
					<input
						bind:this={fileInput}
						type="file"
						accept=".csv"
						on:change={handleFileSelect}
						class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
					/>
					<p class="mt-1 text-sm text-gray-500">
						Upload a CSV file containing your workout data. Maximum file size: 10MB.
					</p>
				</div>

				<!-- Template Download -->
				<div class="mb-6 p-4 bg-blue-50 rounded-lg">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-sm font-medium text-blue-900">Need a template?</h3>
							<p class="text-sm text-blue-700">
								Download our CSV template to ensure proper formatting.
							</p>
						</div>
						<button
							on:click={downloadTemplate}
							class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
						>
							Download Template
						</button>
					</div>
				</div>

				<!-- Import Options -->
				{#if selectedFile}
					<div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2"> Date Format </label>
							<select
								bind:value={dateFormat}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="MM/DD/YYYY">MM/DD/YYYY</option>
								<option value="DD/MM/YYYY">DD/MM/YYYY</option>
								<option value="YYYY-MM-DD">YYYY-MM-DD</option>
								<option value="ISO">ISO (2024-01-15T10:30:00Z)</option>
							</select>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2"> Weight Unit </label>
							<select
								bind:value={weightUnit}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="lbs">Pounds (lbs)</option>
								<option value="kg">Kilograms (kg)</option>
							</select>
						</div>

						<div class="flex items-center">
							<input
								type="checkbox"
								id="generateInsights"
								bind:checked={generateInsights}
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label for="generateInsights" class="ml-2 text-sm text-gray-700">
								Generate AI insights from imported data
							</label>
						</div>

						<div class="flex items-center">
							<input
								type="checkbox"
								id="skipValidation"
								bind:checked={skipValidation}
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label for="skipValidation" class="ml-2 text-sm text-gray-700">
								Skip data validation (not recommended)
							</label>
						</div>
					</div>
				{/if}

				<!-- Validation Results -->
				{#if validationErrors.length > 0}
					<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
						<h3 class="text-sm font-medium text-red-800 mb-2">Validation Errors</h3>
						<ul class="text-sm text-red-700 space-y-1">
							{#each validationErrors as error}
								<li>• {error}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if validationWarnings.length > 0}
					<div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
						<h3 class="text-sm font-medium text-yellow-800 mb-2">Warnings</h3>
						<ul class="text-sm text-yellow-700 space-y-1">
							{#each validationWarnings as warning}
								<li>• {warning}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Data Preview -->
				{#if previewData.length > 0}
					<div class="mb-6">
						<h3 class="text-sm font-medium text-gray-700 mb-2">Data Preview (First 5 rows)</h3>
						<div class="overflow-x-auto border border-gray-200 rounded-md">
							<table class="min-w-full divide-y divide-gray-200">
								<tbody class="bg-white divide-y divide-gray-200">
									{#each previewData as row, rowIndex}
										<tr class={rowIndex === 0 ? 'bg-gray-50' : ''}>
											{#each row as cell}
												<td class="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
													{cell}
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<!-- Import Results -->
				{#if importResult}
					<div
						class="mb-6 p-4 {importResult.success
							? 'bg-green-50 border-green-200'
							: 'bg-red-50 border-red-200'} border rounded-md"
					>
						<h3
							class="text-sm font-medium {importResult.success
								? 'text-green-800'
								: 'text-red-800'} mb-2"
						>
							Import {importResult.success ? 'Successful' : 'Failed'}
						</h3>

						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
							<div>
								<span class="font-medium">Total Rows:</span>
								<span class="ml-1">{importResult.totalRows}</span>
							</div>
							<div>
								<span class="font-medium">Imported:</span>
								<span class="ml-1">{importResult.importedRows}</span>
							</div>
							<div>
								<span class="font-medium">Errors:</span>
								<span class="ml-1">{importResult.errors.length}</span>
							</div>
							<div>
								<span class="font-medium">Insights:</span>
								<span class="ml-1">{importResult.insightsGenerated}</span>
							</div>
						</div>

						{#if importResult.errors.length > 0}
							<div class="mt-3">
								<h4 class="text-sm font-medium text-red-800">Errors:</h4>
								<ul class="text-sm text-red-700 mt-1 space-y-1">
									{#each importResult.errors as error}
										<li>• {error}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if importResult.warnings.length > 0}
							<div class="mt-3">
								<h4 class="text-sm font-medium text-yellow-800">Warnings:</h4>
								<ul class="text-sm text-yellow-700 mt-1 space-y-1">
									{#each importResult.warnings as warning}
										<li>• {warning}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
				<button
					on:click={closeModal}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>

				<button
					on:click={handleImport}
					disabled={!selectedFile || validationErrors.length > 0 || isImporting}
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{#if isImporting}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Importing...
					{:else}
						Import Data
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
