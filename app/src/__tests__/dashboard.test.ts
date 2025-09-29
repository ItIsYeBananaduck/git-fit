import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/dom';
import Dashboard from '../routes/dashboard/+page.svelte';
import { user } from '$lib/stores/auth';
import { writable } from 'svelte/store';

// Mock the API
vi.mock('$lib/api/convex', () => ({
    api: {
        query: vi.fn()
    }
}));

// Mock the export utility
vi.mock('$lib/utils/exportProgramToCsv', () => ({
    exportProgramToCsv: vi.fn(() => 'Week,Day,Exercise,Sets,Reps,Load\n1,Monday,"Bench Press",3,8,80kg')
}));

// Mock URL.createObjectURL and related DOM APIs
global.URL.createObjectURL = vi.fn(() => 'mocked-blob-url');
global.URL.revokeObjectURL = vi.fn();

describe('Dashboard UI', () => {
    const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
    };

    const mockPrograms = [
        {
            _id: 'prog1',
            title: 'Strength Building Program',
            description: 'A comprehensive strength training program',
            durationWeeks: 12,
            goal: 'strength',
            trainerName: 'John Trainer',
            priceType: 'one-time',
            status: 'active',
            subscriptionEnd: '2025-12-31',
            jsonData: {
                name: 'Strength Building Program',
                exercises: [
                    { week: 1, day: 'Monday', name: 'Bench Press', sets: 3, reps: 8, load: '80kg' },
                    { week: 1, day: 'Wednesday', name: 'Squat', sets: 3, reps: 10, load: '100kg' }
                ]
            }
        },
        {
            _id: 'prog2',
            title: 'Weight Loss Program',
            description: 'High intensity training for weight loss',
            durationWeeks: 8,
            goal: 'weight_loss',
            trainerName: 'Jane Trainer',
            priceType: 'subscription',
            status: 'active'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup user store
        user.set(mockUser);
    });

    it('should render purchased programs when user is logged in', async () => {
        const { api } = await import('$lib/api/convex');
        vi.mocked(api.query).mockResolvedValue(mockPrograms);

        render(Dashboard);

        // Wait for loading to complete
        await vi.waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Check that programs are rendered
        expect(screen.getByText('Strength Building Program')).toBeInTheDocument();
        expect(screen.getByText('Weight Loss Program')).toBeInTheDocument();
        expect(screen.getByText('12 weeks • strength')).toBeInTheDocument();
        expect(screen.getByText('8 weeks • weight_loss')).toBeInTheDocument();
        expect(screen.getByText('Trainer: John Trainer')).toBeInTheDocument();
        expect(screen.getByText('Trainer: Jane Trainer')).toBeInTheDocument();
    });

    it('should show error message when user is not logged in', async () => {
        user.set(null);

        render(Dashboard);

        await vi.waitFor(() => {
            expect(screen.getByText('You must be logged in to view your dashboard.')).toBeInTheDocument();
        });
    });

    it('should show empty state when no programs are purchased', async () => {
        const { api } = await import('$lib/api/convex');
        vi.mocked(api.query).mockResolvedValue([]);

        render(Dashboard);

        await vi.waitFor(() => {
            expect(screen.getByText('You have not purchased any programs yet.')).toBeInTheDocument();
        });
    });

    it('should handle API errors gracefully', async () => {
        const { api } = await import('$lib/api/convex');
        vi.mocked(api.query).mockRejectedValue(new Error('Network error'));

        render(Dashboard);

        await vi.waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });

    it('should allow CSV download when clicking CSV button', async () => {
        const { api } = await import('$lib/api/convex');
        const { exportProgramToCsv } = await import('$lib/utils/exportProgramToCsv');
        
        vi.mocked(api.query).mockResolvedValue(mockPrograms);

        // Mock document.createElement and click
        const mockAnchor = {
            href: '',
            download: '',
            click: vi.fn()
        };
        vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

        render(Dashboard);

        await vi.waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Click the CSV download button for the first program
        const csvButtons = screen.getAllByText('Download CSV');
        await fireEvent.click(csvButtons[0]);

        // Verify CSV export was called with correct data
        expect(exportProgramToCsv).toHaveBeenCalledWith(mockPrograms[0].jsonData);
        
        // Verify download link was created and clicked
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockAnchor.download).toBe('Strength Building Program.csv');
        expect(mockAnchor.click).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mocked-blob-url');
    });

    it('should allow JSON download when clicking JSON button', async () => {
        const { api } = await import('$lib/api/convex');
        vi.mocked(api.query).mockResolvedValue(mockPrograms);

        // Mock document.createElement and click
        const mockAnchor = {
            href: '',
            download: '',
            click: vi.fn()
        };
        vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

        render(Dashboard);

        await vi.waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Click the JSON download button for the first program
        const jsonButtons = screen.getAllByText('Download JSON');
        await fireEvent.click(jsonButtons[0]);

        // Verify download link was created and clicked
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockAnchor.download).toBe('Strength Building Program.json');
        expect(mockAnchor.click).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mocked-blob-url');
    });

    it('should display subscription information when available', async () => {
        const { api } = await import('$lib/api/convex');
        vi.mocked(api.query).mockResolvedValue(mockPrograms);

        render(Dashboard);

        await vi.waitFor(() => {
            expect(screen.getByText('Active until 2025-12-31')).toBeInTheDocument();
        });
    });
});
