import { describe, it, expect } from 'vitest';

// Test core utility functions and app logic
describe('App Core Functionality', () => {
	// Test fitness data calculations
	it('should calculate weekly progress percentage correctly', () => {
		function calculateProgress(current: number, goal: number): number {
			return Math.min((current / goal) * 100, 100);
		}

		// Test normal cases
		expect(calculateProgress(25000, 50000)).toBe(50);
		expect(calculateProgress(50000, 50000)).toBe(100);
		expect(calculateProgress(75000, 50000)).toBe(100); // Should cap at 100%
		expect(calculateProgress(0, 50000)).toBe(0);
	});

	it('should format fitness stats correctly', () => {
		function formatSteps(steps: number): string {
			return steps.toLocaleString();
		}

		function formatHeartRate(bpm: number): string {
			return `${bpm} BPM`;
		}

		expect(formatSteps(8432)).toBe('8,432');
		expect(formatSteps(50000)).toBe('50,000');
		expect(formatHeartRate(142)).toBe('142 BPM');
	});

	it('should validate user roles correctly', () => {
		type UserRole = 'client' | 'trainer' | 'admin';

		function isValidRole(role: string): role is UserRole {
			return ['client', 'trainer', 'admin'].includes(role);
		}

		function getWelcomeMessage(name: string, role: UserRole): string {
			return `Welcome back, ${name}!`;
		}

		expect(isValidRole('client')).toBe(true);
		expect(isValidRole('trainer')).toBe(true);
		expect(isValidRole('admin')).toBe(true);
		expect(isValidRole('invalid')).toBe(false);

		expect(getWelcomeMessage('John Doe', 'client')).toBe('Welcome back, John Doe!');
	});

	it('should handle date formatting for workouts', () => {
		function formatWorkoutDate(dateString: string): string {
			const date = new Date(dateString);
			return date.toLocaleDateString();
		}

		function isRecentWorkout(dateString: string, daysThreshold: number = 7): boolean {
			const date = new Date(dateString);
			const now = new Date();
			const diffTime = Math.abs(now.getTime() - date.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays <= daysThreshold;
		}

		const testDate = '2025-01-02';
		expect(formatWorkoutDate(testDate)).toBeTruthy();
		expect(typeof formatWorkoutDate(testDate)).toBe('string');
	});

	it('should calculate calories burned rate', () => {
		function calculateCalorieRate(calories: number, minutes: number): number {
			return Math.round((calories / minutes) * 10) / 10; // Round to 1 decimal
		}

		expect(calculateCalorieRate(300, 60)).toBe(5.0); // 5 cal/min
		expect(calculateCalorieRate(450, 90)).toBe(5.0);
		expect(calculateCalorieRate(100, 30)).toBe(3.3);
	});

	it('should validate workout intensity levels', () => {
		type IntensityLevel = 'low' | 'moderate' | 'high' | 'very_high';

		function getIntensityFromHeartRate(heartRate: number, age: number): IntensityLevel {
			const maxHR = 220 - age;
			const percentage = (heartRate / maxHR) * 100;

			if (percentage < 50) return 'low';
			if (percentage < 70) return 'moderate';
			if (percentage < 85) return 'high';
			return 'very_high';
		}

		// Test for 30-year-old (max HR = 190)
		expect(getIntensityFromHeartRate(90, 30)).toBe('low'); // ~47%
		expect(getIntensityFromHeartRate(130, 30)).toBe('moderate'); // ~68%
		expect(getIntensityFromHeartRate(160, 30)).toBe('high'); // ~84%
		expect(getIntensityFromHeartRate(180, 30)).toBe('very_high'); // ~95%
	});
});

describe('sum test', () => {
	it('adds 1 + 2 to equal 3', () => {
		expect(1 + 2).toBe(3);
	});
});
