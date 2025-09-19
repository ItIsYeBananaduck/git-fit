import type { Id } from '$lib/convex/_generated/dataModel.js';
import { knowledgeBaseEngine, generateWorkoutInsights } from './knowledgeBaseEngine.js';

// CSV Import interfaces
export interface CSVWorkoutData {
	date: string;
	exercise: string;
	sets: number;
	reps: number;
	weight: number;
	restTime?: number;
	heartRate?: number;
	notes?: string;
	duration?: number;
}

export interface CSVImportResult {
	success: boolean;
	totalRows: number;
	importedRows: number;
	errors: string[];
	warnings: string[];
	insightsGenerated: number;
}

export interface CSVValidationError {
	row: number;
	field: string;
	value: string;
	error: string;
}

export interface CSVImportOptions {
	userId: Id<'users'>;
	dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'ISO';
	weightUnit?: 'lbs' | 'kg';
	skipValidation?: boolean;
	generateInsights?: boolean;
	batchSize?: number;
}

// CSV Parser and Validator
export class CSVWorkoutImporter {
	private options: CSVImportOptions;

	constructor(options: CSVImportOptions) {
		this.options = {
			dateFormat: 'MM/DD/YYYY',
			weightUnit: 'lbs',
			skipValidation: false,
			generateInsights: true,
			batchSize: 100,
			...options
		};
	}

	// Parse CSV content and validate
	async importFromCSV(csvContent: string): Promise<CSVImportResult> {
		const result: CSVImportResult = {
			success: false,
			totalRows: 0,
			importedRows: 0,
			errors: [],
			warnings: [],
			insightsGenerated: 0
		};

		try {
			// Parse CSV
			const rows = this.parseCSV(csvContent);
			result.totalRows = rows.length;

			if (rows.length === 0) {
				result.errors.push('CSV file is empty');
				return result;
			}

			// Validate headers
			const headers = rows[0];
			const validationResult = this.validateHeaders(headers);
			if (!validationResult.valid) {
				result.errors.push(...validationResult.errors);
				return result;
			}

			// Process data rows
			const dataRows = rows.slice(1);
			const validData: CSVWorkoutData[] = [];
			const errors: CSVValidationError[] = [];

			// Validate each row
			for (let i = 0; i < dataRows.length; i++) {
				const row = dataRows[i];
				const rowNumber = i + 2; // +2 because of 0-indexing and header row

				const validation = this.validateRow(row, headers, rowNumber);
				if (validation.valid && validation.data) {
					validData.push(validation.data);
				} else {
					errors.push(...validation.errors);
				}
			}

			// Add validation errors to result
			result.errors.push(...errors.map(e => `Row ${e.row}: ${e.error}`));

			if (validData.length === 0) {
				result.errors.push('No valid data rows found');
				return result;
			}

			// Group by date and process in batches
			const workoutsByDate = this.groupWorkoutsByDate(validData);

			// Process each workout
			for (const [date, workoutData] of workoutsByDate.entries()) {
				try {
					await this.processWorkoutBatch(workoutData, date, result);
				} catch (error) {
					result.errors.push(`Failed to process workout for ${date}: ${error}`);
				}
			}

			result.success = result.errors.length === 0;
			result.importedRows = validData.length;

		} catch (error) {
			result.errors.push(`CSV parsing failed: ${error}`);
		}

		return result;
	}

	// Parse CSV string into rows
	private parseCSV(content: string): string[][] {
		const rows: string[][] = [];
		let currentRow: string[] = [];
		let currentField = '';
		let inQuotes = false;
		let i = 0;

		while (i < content.length) {
			const char = content[i];
			const nextChar = content[i + 1];

			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					// Escaped quote
					currentField += '"';
					i += 2;
					continue;
				} else {
					// Toggle quote state
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				// Field separator
				currentRow.push(currentField.trim());
				currentField = '';
			} else if ((char === '\n' || char === '\r') && !inQuotes) {
				// Row separator
				if (currentField || currentRow.length > 0) {
					currentRow.push(currentField.trim());
					rows.push(currentRow);
					currentRow = [];
					currentField = '';
				}
				// Skip \r\n sequence
				if (char === '\r' && nextChar === '\n') {
					i++;
				}
			} else {
				currentField += char;
			}

			i++;
		}

		// Add final field/row
		if (currentField || currentRow.length > 0) {
			currentRow.push(currentField.trim());
			rows.push(currentRow);
		}

		return rows;
	}

	// Validate CSV headers
	private validateHeaders(headers: string[]): { valid: boolean; errors: string[] } {
		const requiredHeaders = ['date', 'exercise'];

		const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
		const errors: string[] = [];

		// Check required headers
		for (const required of requiredHeaders) {
			if (!normalizedHeaders.includes(required)) {
				errors.push(`Missing required header: ${required}`);
			}
		}

		// Check for duplicate headers
		const duplicates = normalizedHeaders.filter((h, i) => normalizedHeaders.indexOf(h) !== i);
		if (duplicates.length > 0) {
			errors.push(`Duplicate headers found: ${duplicates.join(', ')}`);
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	// Validate a single data row
	private validateRow(
		row: string[],
		headers: string[],
		rowNumber: number
	): { valid: boolean; data?: CSVWorkoutData; errors: CSVValidationError[] } {
		const errors: CSVValidationError[] = [];
		const data: Partial<CSVWorkoutData> = {};

		// Map headers to values
		const headerMap: Record<string, string> = {};
		headers.forEach((header, index) => {
			headerMap[header.toLowerCase().trim()] = row[index] || '';
		});

		// Validate date
		const dateStr = headerMap['date'];
		if (!dateStr) {
			errors.push({ row: rowNumber, field: 'date', value: dateStr, error: 'Date is required' });
		} else {
			const parsedDate = this.parseDate(dateStr);
			if (!parsedDate) {
				errors.push({ row: rowNumber, field: 'date', value: dateStr, error: `Invalid date format. Expected ${this.options.dateFormat}` });
			} else {
				data.date = parsedDate.toISOString().split('T')[0];
			}
		}

		// Validate exercise
		const exercise = headerMap['exercise'];
		if (!exercise) {
			errors.push({ row: rowNumber, field: 'exercise', value: exercise, error: 'Exercise is required' });
		} else {
			data.exercise = exercise.trim();
		}

		// Validate numeric fields
		const numericFields = ['sets', 'reps', 'weight', 'restTime', 'heartRate', 'duration'];
		for (const field of numericFields) {
			const value = headerMap[field];
			if (value) {
				const num = parseFloat(value);
				if (isNaN(num)) {
					errors.push({ row: rowNumber, field, value, error: `${field} must be a valid number` });
				} else {
					(data as Record<string, unknown>)[field] = num;
				}
			}
		}

		// Validate ranges
		if (data.sets !== undefined && (data.sets < 1 || data.sets > 20)) {
			errors.push({ row: rowNumber, field: 'sets', value: String(data.sets), error: 'Sets must be between 1 and 20' });
		}

		if (data.reps !== undefined && (data.reps < 1 || data.reps > 100)) {
			errors.push({ row: rowNumber, field: 'reps', value: String(data.reps), error: 'Reps must be between 1 and 100' });
		}

		if (data.weight !== undefined && data.weight < 0) {
			errors.push({ row: rowNumber, field: 'weight', value: String(data.weight), error: 'Weight cannot be negative' });
		}

		if (data.heartRate !== undefined && (data.heartRate < 40 || data.heartRate > 220)) {
			errors.push({ row: rowNumber, field: 'heartRate', value: String(data.heartRate), error: 'Heart rate must be between 40 and 220 bpm' });
		}

		// Handle notes
		if (headerMap['notes']) {
			data.notes = headerMap['notes'].trim();
		}

		return {
			valid: errors.length === 0,
			data: errors.length === 0 ? data as CSVWorkoutData : undefined,
			errors
		};
	}

	// Parse date string based on format
	private parseDate(dateStr: string): Date | null {
		const format = this.options.dateFormat;
		const trimmed = dateStr.trim();

		try {
			switch (format) {
				case 'MM/DD/YYYY': {
					const [month, day, year] = trimmed.split('/').map(Number);
					return new Date(year, month - 1, day);
				}

				case 'DD/MM/YYYY': {
					const [day2, month2, year2] = trimmed.split('/').map(Number);
					return new Date(year2, month2 - 1, day2);
				}

				case 'YYYY-MM-DD':
					return new Date(trimmed + 'T00:00:00');

				case 'ISO':
					return new Date(trimmed);

				default:
					return new Date(trimmed);
			}
		} catch {
			return null;
		}
	}

	// Group workout data by date
	private groupWorkoutsByDate(data: CSVWorkoutData[]): Map<string, CSVWorkoutData[]> {
		const groups = new Map<string, CSVWorkoutData[]>();

		data.forEach(workout => {
			if (!groups.has(workout.date)) {
				groups.set(workout.date, []);
			}
			groups.get(workout.date)!.push(workout);
		});

		return groups;
	}

	// Process a batch of workout data for a specific date
	private async processWorkoutBatch(
		workoutData: CSVWorkoutData[],
		date: string,
		result: CSVImportResult
	): Promise<void> {
		// Group by exercise
		const exercisesByName = new Map<string, CSVWorkoutData[]>();

		workoutData.forEach(workout => {
			if (!exercisesByName.has(workout.exercise)) {
				exercisesByName.set(workout.exercise, []);
			}
			exercisesByName.get(workout.exercise)!.push(workout);
		});

		// Calculate workout duration if not provided
		let totalDuration = workoutData.reduce((sum, w) => sum + (w.duration || 0), 0);
		if (totalDuration === 0) {
			// Estimate duration: 5 minutes per set + rest time
			totalDuration = workoutData.reduce((sum, w) => {
				const sets = w.sets || 1;
				const restTime = w.restTime || 60;
				return sum + (sets * 5) + ((sets - 1) * restTime);
			}, 0);
		}

		// Calculate average heart rate
		const heartRates = workoutData.filter(w => w.heartRate).map(w => w.heartRate!);
		const averageHeartRate = heartRates.length > 0 ?
			heartRates.reduce((a, b) => a + b, 0) / heartRates.length : 0;

		// Convert to analysis format
		const analysisData = {
			workoutId: `csv_import_${date}_${Date.now()}` as Id<'workouts'>,
			exercises: Array.from(exercisesByName.entries()).map(([exerciseName, sets]) => ({
				exerciseId: exerciseName.toLowerCase().replace(/\s+/g, '_'),
				sets: sets.flatMap(workout =>
					Array.from({ length: workout.sets || 1 }, () => ({
						reps: workout.reps,
						weight: this.convertWeight(workout.weight),
						heartRate: workout.heartRate || averageHeartRate,
						restTime: workout.restTime || 60
					}))
				)
			})),
			duration: totalDuration,
			averageHeartRate
		};

		// Generate insights if enabled
		if (this.options.generateInsights) {
			try {
				const insights = generateWorkoutInsights(this.options.userId, analysisData);
				insights.forEach(insight => {
					knowledgeBaseEngine.storeInsight(insight);
				});
				result.insightsGenerated += insights.length;
			} catch (error) {
				result.warnings.push(`Failed to generate insights for ${date}: ${error}`);
			}
		}

		// Here you would typically save the workout data to your database
		// For now, we'll just log the processed data
		console.log(`Processed workout for ${date}:`, {
			exercises: analysisData.exercises.length,
			totalSets: analysisData.exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
			duration: analysisData.duration,
			averageHeartRate: analysisData.averageHeartRate
		});
	}

	// Convert weight based on unit preference
	private convertWeight(weight: number): number {
		if (this.options.weightUnit === 'kg') {
			// Convert kg to lbs for internal storage
			return weight * 2.20462;
		}
		return weight;
	}

	// Generate CSV template
	static generateCSVTemplate(): string {
		const headers = [
			'date',
			'exercise',
			'sets',
			'reps',
			'weight',
			'restTime',
			'heartRate',
			'notes',
			'duration'
		];

		const sampleData = [
			'2024-01-15',
			'Bench Press',
			'4',
			'8',
			'185',
			'120',
			'150',
			'Good form, felt strong',
			'45'
		];

		return [headers.join(','), sampleData.join(',')].join('\n');
	}

	// Validate CSV file before import
	static async validateCSVFile(file: File): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Check file size
		if (file.size > 10 * 1024 * 1024) { // 10MB limit
			errors.push('File size exceeds 10MB limit');
		}

		// Check file extension
		if (!file.name.toLowerCase().endsWith('.csv')) {
			warnings.push('File does not have .csv extension');
		}

		// Read first few lines for validation
		try {
			const text = await file.text();
			const lines = text.split('\n').slice(0, 5);

			if (lines.length === 0) {
				errors.push('File appears to be empty');
			} else {
				// Check for basic CSV structure
				const firstLine = lines[0].split(',');
				if (firstLine.length < 2) {
					warnings.push('First line does not appear to contain CSV headers');
				}

				// Check for potential encoding issues
				if (text.includes('�')) {
					warnings.push('File may have encoding issues (found replacement characters)');
				}
			}
		} catch (error) {
			errors.push(`Failed to read file: ${error}`);
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings
		};
	}
}

// Helper functions
export function createCSVImporter(options: CSVImportOptions): CSVWorkoutImporter {
	return new CSVWorkoutImporter(options);
}

export async function importWorkoutsFromCSV(
	csvContent: string,
	options: CSVImportOptions
): Promise<CSVImportResult> {
	const importer = new CSVWorkoutImporter(options);
	return importer.importFromCSV(csvContent);
}

export function generateCSVTemplate(): string {
	return CSVWorkoutImporter.generateCSVTemplate();
}

export async function validateCSVFile(file: File) {
	return CSVWorkoutImporter.validateCSVFile(file);
}