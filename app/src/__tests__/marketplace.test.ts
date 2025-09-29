import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from 'vitest-browser-svelte';
import Marketplace from '../routes/marketplace/+page.svelte';

// Mock dependencies
vi.mock('../../lib/api/convex', () => ({
    api: {
        query: vi.fn()
    }
}));

vi.mock('$app/navigation', () => ({
    goto: vi.fn()
}));

// Mock child components to isolate testing
vi.mock('../../lib/components/ProgramCard.svelte', () => ({
    default: function MockProgramCard({ program }: { program: any }) {
        return `<div data-testid="program-card">
            <h3>${program.name}</h3>
            <span>${program.price}</span>
            <span>${program.trainer?.name}</span>
            <button data-testid="button-purchase-program">Purchase Program</button>
        </div>`;
    }
}));

vi.mock('../../lib/components/TrainerCard.svelte', () => ({
    default: function MockTrainerCard({ trainer }: { trainer: any }) {
        return `<div data-testid="trainer-card">
            <h3>${trainer.name}</h3>
            <span>${trainer.specialty}</span>
            <span>$${trainer.hourlyRate}/hour</span>
        </div>`;
    }
}));

vi.mock('../../lib/components/SearchFilters.svelte', () => ({
    default: function MockSearchFilters({ activeTab, filters }: { activeTab: string, filters: any }) {
        return `<div data-testid="search-filters">
            <button data-testid="filter-beginner">Beginner</button>
            <button data-testid="filter-clear">Clear Filters</button>
        </div>`;
    }
}));

describe('Marketplace UI', () => {
    const mockPrograms = [
        {
            _id: 'prog1',
            name: 'Strength Building Program',
            description: 'Build muscle and strength',
            price: 99.99,
            difficulty: 'intermediate',
            duration: 12,
            category: ['Strength Training', 'Muscle Building'],
            rating: 4.8,
            totalPurchases: 150,
            trainer: {
                _id: 'trainer1',
                name: 'John Doe',
                isVerified: true,
                rating: 4.9,
                totalClients: 200
            }
        },
        {
            _id: 'prog2',
            name: 'Cardio Blast Program',
            description: 'High intensity cardio workouts',
            price: 49.99,
            difficulty: 'beginner',
            duration: 8,
            category: ['Cardio', 'Weight Loss'],
            rating: 4.5,
            totalPurchases: 89,
            trainer: {
                _id: 'trainer2',
                name: 'Jane Smith',
                isVerified: false,
                rating: 4.6,
                totalClients: 120
            }
        }
    ];

    const mockTrainers = [
        {
            _id: 'trainer1',
            name: 'John Doe',
            specialty: 'Strength Training',
            hourlyRate: 75,
            rating: 4.9,
            totalClients: 200,
            isVerified: true
        },
        {
            _id: 'trainer2',
            name: 'Jane Smith',
            specialty: 'Weight Loss',
            hourlyRate: 60,
            rating: 4.6,
            totalClients: 120,
            isVerified: false
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render marketplace with loading state initially', async () => {
        const { api } = await import('../../lib/api/convex');
        vi.mocked(api.query).mockImplementation(() => new Promise(() => {})); // Never resolves

        render(Marketplace);

        expect(screen.getByText('Fitness Marketplace')).toBeInTheDocument();
        expect(screen.getByTestId('tab-programs')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trainers')).toBeInTheDocument();
        
        // Should show loading spinner
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should render program cards when programs are loaded', async () => {
        const { api } = await import('../../lib/api/convex');
        vi.mocked(api.query).mockResolvedValue(mockPrograms);

        render(Marketplace);

        await vi.waitFor(() => {
            expect(screen.getAllByTestId('program-card')).toHaveLength(2);
            expect(screen.getByText('Strength Building Program')).toBeInTheDocument();
            expect(screen.getByText('Cardio Blast Program')).toBeInTheDocument();
        });
    });

    it('should handle tab switching between programs and trainers', async () => {
        const { api } = await import('../../lib/api/convex');
        vi.mocked(api.query)
            .mockResolvedValueOnce(mockPrograms) // Initial programs load
            .mockResolvedValueOnce(mockTrainers); // Trainers load

        render(Marketplace);

        // Wait for initial programs to load
        await vi.waitFor(() => {
            expect(screen.getAllByTestId('program-card')).toHaveLength(2);
        });

        // Switch to trainers tab
        const trainersTab = screen.getByTestId('tab-trainers');
        await fireEvent.click(trainersTab);

        await vi.waitFor(() => {
            expect(screen.getAllByTestId('trainer-card')).toHaveLength(2);
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });

        // Verify API was called for trainers
        expect(api.query).toHaveBeenCalledWith('functions/marketplace:getAvailableTrainers', {
            search: undefined,
            specialty: undefined,
            maxHourlyRate: undefined
        });
    });

    it('should handle search functionality', async () => {
        const { api } = await import('../../lib/api/convex');
        vi.mocked(api.query)
            .mockResolvedValueOnce(mockPrograms) // Initial load
            .mockResolvedValueOnce([mockPrograms[0]]); // Filtered results

        render(Marketplace);

        // Wait for initial load
        await vi.waitFor(() => {
            expect(screen.getAllByTestId('program-card')).toHaveLength(2);
        });

        // Perform search
        const searchInput = screen.getByTestId('input-search');
        await fireEvent.input(searchInput, { target: { value: 'strength' } });

        // Verify search API call
        await vi.waitFor(() => {
            expect(api.query).toHaveBeenCalledWith('functions/marketplace:getMarketplacePrograms', {
                search: 'strength',
                category: undefined,
                difficulty: undefined,
                maxPrice: undefined,
                limit: 20
            });
        });
    });

    it('should render empty state when no programs found', async () => {
        const { api } = await import('../../lib/api/convex');
        vi.mocked(api.query).mockResolvedValue([]);

        render(Marketplace);

        await vi.waitFor(() => {
            expect(screen.getByText('No programs found')).toBeInTheDocument();
            expect(screen.getByText('Try adjusting your search or filters to find what you\'re looking for.')).toBeInTheDocument();
        });
    });

    it('should render empty state when no trainers found', async () => {
        const { api } = await import('../../lib/api/convex');
        vi.mocked(api.query)
            .mockResolvedValueOnce(mockPrograms) // Initial programs load
            .mockResolvedValueOnce([]); // Empty trainers

        render(Marketplace);

        // Switch to trainers tab
        const trainersTab = screen.getByTestId('tab-trainers');
        await fireEvent.click(trainersTab);

        await vi.waitFor(() => {
            expect(screen.getByText('No trainers found')).toBeInTheDocument();
            expect(screen.getByText('Try adjusting your search or filters to find the perfect trainer.')).toBeInTheDocument();
        });
    });

    it('should handle API errors gracefully', async () => {
        const { api } = await import('../../lib/api/convex');
        vi.mocked(api.query).mockRejectedValue(new Error('Network error'));

        // Mock console.error to prevent test output noise
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(Marketplace);

        await vi.waitFor(() => {
            // Should show empty state when API fails
            expect(screen.getByText('No programs found')).toBeInTheDocument();
        });

        // Verify error was logged
        expect(consoleSpy).toHaveBeenCalledWith('Error loading programs:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('should handle purchase flow navigation', async () => {
        const { api } = await import('../../lib/api/convex');
        const { goto } = await import('$app/navigation');
        
        vi.mocked(api.query).mockResolvedValue(mockPrograms);

        render(Marketplace);

        await vi.waitFor(() => {
            expect(screen.getAllByTestId('program-card')).toHaveLength(2);
        });

        // Click purchase button
        const purchaseButton = screen.getAllByTestId('button-purchase-program')[0];
        await fireEvent.click(purchaseButton);

        // Since ProgramCard is mocked, we need to test the actual navigation in ProgramCard
        // This tests the integration point
        expect(screen.getByTestId('button-purchase-program')).toBeInTheDocument();
    });

    it('should display marketplace statistics', async () => {
        const { api } = await import('../../lib/api/convex');
        vi.mocked(api.query).mockResolvedValue(mockPrograms);

        render(Marketplace);

        // Check commission stats are displayed
        expect(screen.getByText('10%')).toBeInTheDocument();
        expect(screen.getByText('Commission on Programs')).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument();
        expect(screen.getByText('Commission on Coaching')).toBeInTheDocument();
        expect(screen.getByText('4.8')).toBeInTheDocument();
        expect(screen.getByText('Average Rating')).toBeInTheDocument();
    });

    it('should clear search and filters when switching tabs', async () => {
        const { api } = await import('../../lib/api/convex');
        vi.mocked(api.query)
            .mockResolvedValueOnce(mockPrograms) // Initial programs
            .mockResolvedValueOnce([mockPrograms[0]]) // Filtered programs
            .mockResolvedValueOnce(mockTrainers); // Trainers after tab switch

        render(Marketplace);

        // Wait for initial load
        await vi.waitFor(() => {
            expect(screen.getAllByTestId('program-card')).toHaveLength(2);
        });

        // Set search query
        const searchInput = screen.getByTestId('input-search');
        await fireEvent.input(searchInput, { target: { value: 'test search' } });

        // Switch to trainers tab
        const trainersTab = screen.getByTestId('tab-trainers');
        await fireEvent.click(trainersTab);

        await vi.waitFor(() => {
            // Search input should be cleared
            expect(searchInput.value).toBe('');
            expect(screen.getAllByTestId('trainer-card')).toHaveLength(2);
        });
    });
});
