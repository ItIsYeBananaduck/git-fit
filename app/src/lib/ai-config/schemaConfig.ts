// Schema Configuration
export interface SchemaConfig {
    user_configs: {
        userId: string;
        configJson: string; // stringified JSON object
        createdAt: string;
        updatedAt: string;
    };
    user_monthly_summaries: {
        userId: string;
        monthKey: string; // e.g. "2025-09"
        monthlySummaryJson: string; // stringified JSON
        createdAt: string;
        updatedAt: string;
    };
    user_yearly_summaries: {
        userId: string;
        yearlySummaryJson: string; // stringified JSON object
        subscriptionStartDate: string; // Unix timestamp as string
        createdAt: string;
        updatedAt: string;
    };
}