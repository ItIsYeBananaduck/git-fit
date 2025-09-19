<script lang="ts">
	import Papa from 'papaparse';
	import * as XLSX from 'xlsx';
	import { onMount } from 'svelte';

	// Type declarations for papaparse
	declare module 'papaparse' {
		interface ParseResult<T> {
			data: T[];
			errors: any[];
			meta: any;
		}

		interface ParseConfig {
			header?: boolean;
			complete?: (results: ParseResult<any>) => void;
			error?: (error: any) => void;
		}

		function parse(file: File, config: ParseConfig): void;
	}

	let file: File | null = null;
	let error = '';
	let parsedData: any = null;
	let uploadStatus = '';

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
			uploadStatus = 'Uploading...';
			// Validate required fields (example: name, sets, reps, load)
			const required = ['name', 'sets', 'reps', 'load'];
			for (const row of parsedData) {
				for (const field of required) {
					if (!(field in row)) {
						throw new Error(`Missing required field: ${field}`);
					}
				}
			}
			// TODO: Implement actual upload to backend
			console.log('Uploading program data:', {
				file: btoa(JSON.stringify(parsedData)),
				filename: file.name,
				mimetype: file.type,
				trainerId: 'TRAINER_ID' // Replace with actual trainer/user id
			});
			uploadStatus = 'Upload successful!';
		} catch (e: any) {
			error = e.message || 'Upload failed.';
			uploadStatus = '';
		}
	}
</script>

<div class="space-y-4">
	<input type="file" accept=".csv,.xlsx,.xls" on:change={handleFileChange} />
	{#if error}
		<div class="text-red-600">{error}</div>
	{/if}
	{#if parsedData}
		<div class="text-green-700">File parsed successfully. Rows: {parsedData.length}</div>
		<button class="bg-primary text-white px-4 py-2 rounded" on:click={uploadParsedData}>
			Upload to Backend
		</button>
	{/if}
	{#if uploadStatus}
		<div class="text-blue-700">{uploadStatus}</div>
	{/if}
</div>
