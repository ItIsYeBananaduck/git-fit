import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../_generated/api.js';
import schema from '../schema.js';

// Mock Stripe SDK
const mockStripe = {
    accounts: {
        create: vi.fn()
    },
    accountLinks: {
        create: vi.fn()
    },
    checkout: {
        sessions: {
            create: vi.fn()
        }
    },
    webhooks: {
        constructEvent: vi.fn()
    }
};

vi.mock('stripe', () => {
    return {
        default: vi.fn(() => mockStripe)
    };
});

// Mock require for Stripe
global.require = vi.fn((module) => {
    if (module === 'stripe') {
        return vi.fn(() => mockStripe);
    }
    return vi.fn();
});

describe('payments backend', () => {
    let t: any;

    beforeEach(() => {
        t = convexTest(schema);
        vi.clearAllMocks();

        // Mock environment variables
        process.env.STRIPE_SECRET_KEY = 'sk_test_123';
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
        process.env.STRIPE_ONBOARDING_REFRESH_URL = 'https://test.com/refresh';
        process.env.STRIPE_ONBOARDING_RETURN_URL = 'https://test.com/return';
    });

    describe('createStripeConnectAccount', () => {
        it('should create Stripe Connect account (mocked)', async () => {
            // Mock successful Stripe account creation
            const mockAccount = {
                id: 'acct_test123',
                email: 'trainer@example.com'
            };
            mockStripe.accounts.create.mockResolvedValue(mockAccount);

            // Mock onboarding link creation
            const mockAccountLink = {
                url: 'https://connect.stripe.com/setup/123'
            };
            mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink);

            // Create a test trainer user
            const trainerId = await t.db.insert('users', {
                email: 'trainer@example.com',
                name: 'Test Trainer',
                role: 'trainer',
                emailVerified: true
            });

            // Test the mutation
            const result = await t.mutation(api.functions.payments.createStripeConnectAccount, {
                trainerId,
                email: 'trainer@example.com'
            });

            expect(result.stripeAccountId).toBe('acct_test123');
            expect(result.onboardingUrl).toBe('https://connect.stripe.com/setup/123');

            // Verify Stripe account creation was called correctly
            expect(mockStripe.accounts.create).toHaveBeenCalledWith({
                type: 'express',
                email: 'trainer@example.com',
                capabilities: {
                    transfers: { requested: true }
                }
            });

            // Verify onboarding link creation
            expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
                account: 'acct_test123',
                refresh_url: 'https://test.com/refresh',
                return_url: 'https://test.com/return',
                type: 'account_onboarding'
            });

            // Verify user record was updated
            const updatedUser = await t.db.get(trainerId);
            expect(updatedUser.stripeAccountId).toBe('acct_test123');
        });

        it('should handle Stripe account creation failures', async () => {
            const trainerId = await t.db.insert('users', {
                email: 'trainer@example.com',
                name: 'Test Trainer',
                role: 'trainer',
                emailVerified: true
            });

            // Mock Stripe failure
            mockStripe.accounts.create.mockRejectedValue(new Error('Stripe API error'));

            await expect(
                t.mutation(api.functions.payments.createStripeConnectAccount, {
                    trainerId,
                    email: 'trainer@example.com'
                })
            ).rejects.toThrow('Stripe Connect account creation failed: Stripe API error');
        });

        it('should handle missing Stripe secret key', async () => {
            delete process.env.STRIPE_SECRET_KEY;

            const trainerId = await t.db.insert('users', {
                email: 'trainer@example.com',
                name: 'Test Trainer',
                role: 'trainer',
                emailVerified: true
            });

            await expect(
                t.mutation(api.functions.payments.createStripeConnectAccount, {
                    trainerId,
                    email: 'trainer@example.com'
                })
            ).rejects.toThrow('STRIPE_SECRET_KEY environment variable is not set');
        });

        it('should handle onboarding link creation failure gracefully', async () => {
            const mockAccount = { id: 'acct_test123' };
            mockStripe.accounts.create.mockResolvedValue(mockAccount);

            // Mock onboarding link failure
            mockStripe.accountLinks.create.mockRejectedValue(new Error('Onboarding link error'));

            const trainerId = await t.db.insert('users', {
                email: 'trainer@example.com',
                name: 'Test Trainer',
                role: 'trainer',
                emailVerified: true
            });

            const result = await t.mutation(api.functions.payments.createStripeConnectAccount, {
                trainerId,
                email: 'trainer@example.com'
            });

            expect(result.stripeAccountId).toBe('acct_test123');
            expect(result.onboardingUrl).toBeNull();
        });
    });

    describe('recordRevenueTransaction', () => {
        let trainerId: string;
        let clientId: string;

        beforeEach(async () => {
            trainerId = await t.db.insert('users', {
                email: 'trainer@example.com',
                name: 'Test Trainer',
                role: 'trainer',
                emailVerified: true
            });

            clientId = await t.db.insert('users', {
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client',
                emailVerified: true
            });
        });

        it('should calculate commission correctly for program purchases', async () => {
            const grossAmount = 100.00;

            const result = await t.mutation(api.functions.payments.recordRevenueTransaction, {
                referenceId: 'program_123',
                trainerId,
                clientId,
                grossAmount,
                type: 'program_purchase',
                paymentMethod: 'card'
            });

            expect(result.transactionId).toBeDefined();

            // Verify transaction was recorded correctly
            const transaction = await t.db.get(result.transactionId);
            expect(transaction.grossAmount).toBe(100.00);
            expect(transaction.platformFee).toBe(20.00); // 20% commission
            expect(transaction.trainerEarnings).toBe(80.00); // 80% to trainer
            expect(transaction.netPlatformEarnings).toBe(20.00);
            expect(transaction.payoutStatus).toBe('pending');
            expect(transaction.type).toBe('program_purchase');
        });

        it('should calculate commission correctly for coaching services', async () => {
            const grossAmount = 150.00;

            const result = await t.mutation(api.functions.payments.recordRevenueTransaction, {
                referenceId: 'coaching_456',
                trainerId,
                clientId,
                grossAmount,
                type: 'coaching_service'
            });

            const transaction = await t.db.get(result.transactionId);
            expect(transaction.grossAmount).toBe(150.00);
            expect(transaction.platformFee).toBe(30.00); // 20% commission
            expect(transaction.trainerEarnings).toBe(120.00); // 80% to trainer
            expect(transaction.type).toBe('coaching_service');
        });

        it('should handle edge cases in commission calculation', async () => {
            // Test small amounts (rounding)
            const result1 = await t.mutation(api.functions.payments.recordRevenueTransaction, {
                referenceId: 'small_amount',
                trainerId,
                clientId,
                grossAmount: 9.99,
                type: 'program_purchase'
            });

            const transaction1 = await t.db.get(result1.transactionId);
            expect(transaction1.platformFee).toBe(2.00); // Rounded to 2 decimal places
            expect(transaction1.trainerEarnings).toBe(7.99);

            // Test zero amount
            const result2 = await t.mutation(api.functions.payments.recordRevenueTransaction, {
                referenceId: 'zero_amount',
                trainerId,
                clientId,
                grossAmount: 0,
                type: 'program_purchase'
            });

            const transaction2 = await t.db.get(result2.transactionId);
            expect(transaction2.platformFee).toBe(0);
            expect(transaction2.trainerEarnings).toBe(0);
        });

        it('should record transaction metadata correctly', async () => {
            const result = await t.mutation(api.functions.payments.recordRevenueTransaction, {
                referenceId: 'test_ref',
                trainerId,
                clientId,
                grossAmount: 50.00,
                type: 'program_purchase',
                paymentMethod: 'apple_pay'
            });

            const transaction = await t.db.get(result.transactionId);
            expect(transaction.metadata.paymentMethod).toBe('apple_pay');
            expect(transaction.transactionDate).toBeDefined();
            expect(new Date(transaction.transactionDate)).toBeInstanceOf(Date);
        });

        it('should handle missing optional payment method', async () => {
            const result = await t.mutation(api.functions.payments.recordRevenueTransaction, {
                referenceId: 'no_payment_method',
                trainerId,
                clientId,
                grossAmount: 75.00,
                type: 'coaching_service'
            });

            const transaction = await t.db.get(result.transactionId);
            expect(transaction.metadata.paymentMethod).toBeNull();
        });
    });

    describe('createSubscriptionCheckoutSession', () => {
        let programId: string;
        let userId: string;

        beforeEach(async () => {
            programId = await t.db.insert('trainingPrograms', {
                name: 'Test Program',
                stripePriceId: 'price_test123',
                description: 'Test program description',
                durationWeeks: 12,
                price: 99.99
            });

            userId = await t.db.insert('users', {
                email: 'user@example.com',
                name: 'Test User',
                role: 'client',
                emailVerified: true
            });
        });

        it('should create Stripe checkout session successfully', async () => {
            const mockSession = {
                url: 'https://checkout.stripe.com/test123'
            };
            mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

            const result = await t.mutation(api.functions.payments.createSubscriptionCheckoutSession, {
                programId,
                userId,
                successUrl: 'https://test.com/success',
                cancelUrl: 'https://test.com/cancel'
            });

            expect(result.url).toBe('https://checkout.stripe.com/test123');

            // Verify Stripe session creation was called correctly
            expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
                mode: 'subscription',
                line_items: [{ price: 'price_test123', quantity: 1 }],
                customer_email: 'user@example.com',
                success_url: 'https://test.com/success',
                cancel_url: 'https://test.com/cancel'
            });
        });

        it('should handle missing program', async () => {
            const nonExistentId = 'nonexistent_program_id';

            await expect(
                t.mutation(api.functions.payments.createSubscriptionCheckoutSession, {
                    programId: nonExistentId,
                    userId,
                    successUrl: 'https://test.com/success',
                    cancelUrl: 'https://test.com/cancel'
                })
            ).rejects.toThrow('Program not found');
        });

        it('should handle missing user', async () => {
            const nonExistentUserId = 'nonexistent_user_id';

            await expect(
                t.mutation(api.functions.payments.createSubscriptionCheckoutSession, {
                    programId,
                    userId: nonExistentUserId,
                    successUrl: 'https://test.com/success',
                    cancelUrl: 'https://test.com/cancel'
                })
            ).rejects.toThrow('User not found');
        });

        it('should handle missing Stripe price ID', async () => {
            const programWithoutPrice = await t.db.insert('trainingPrograms', {
                name: 'Program Without Price',
                description: 'Test program',
                durationWeeks: 8,
                price: 49.99
                // Missing stripePriceId
            });

            await expect(
                t.mutation(api.functions.payments.createSubscriptionCheckoutSession, {
                    programId: programWithoutPrice,
                    userId,
                    successUrl: 'https://test.com/success',
                    cancelUrl: 'https://test.com/cancel'
                })
            ).rejects.toThrow('Program is missing Stripe price ID');
        });

        it('should handle user without email', async () => {
            const userWithoutEmail = await t.db.insert('users', {
                name: 'User Without Email',
                role: 'client',
                emailVerified: false
                // Missing email
            });

            await expect(
                t.mutation(api.functions.payments.createSubscriptionCheckoutSession, {
                    programId,
                    userId: userWithoutEmail,
                    successUrl: 'https://test.com/success',
                    cancelUrl: 'https://test.com/cancel'
                })
            ).rejects.toThrow('User is missing email');
        });

        it('should handle Stripe checkout session creation failure', async () => {
            mockStripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe checkout error'));

            await expect(
                t.mutation(api.functions.payments.createSubscriptionCheckoutSession, {
                    programId,
                    userId,
                    successUrl: 'https://test.com/success',
                    cancelUrl: 'https://test.com/cancel'
                })
            ).rejects.toThrow('Stripe Checkout session creation failed: Stripe checkout error');
        });
    });

    describe('stripeWebhook', () => {
        it('should handle checkout.session.completed event', async () => {
            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        metadata: {
                            referenceId: 'program_123',
                            trainerId: 'trainer_456',
                            clientId: 'client_789',
                            type: 'program_purchase'
                        },
                        amount_total: 10000, // $100.00 in cents
                        payment_method_types: ['card']
                    }
                }
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

            // Mock request object
            const mockRequest = {
                text: vi.fn().mockResolvedValue('{"test": "webhook"}'),
                headers: {
                    get: vi.fn().mockReturnValue('test_signature')
                }
            };

            // Create test users for the webhook
            const trainerId = await t.db.insert('users', {
                email: 'trainer@example.com',
                name: 'Test Trainer',
                role: 'trainer'
            });

            const clientId = await t.db.insert('users', {
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client'
            });

            // Update the mock to use real IDs
            mockEvent.data.object.metadata.trainerId = trainerId;
            mockEvent.data.object.metadata.clientId = clientId;

            const response = await t.action(api.functions.payments.stripeWebhook, mockRequest);

            expect(response.status).toBe(200);
            expect(response.body).toBe('Webhook received');

            // Verify webhook signature verification was called
            expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
                '{"test": "webhook"}',
                'test_signature',
                'whsec_123'
            );
        });

        it('should handle webhook signature verification failure', async () => {
            mockStripe.webhooks.constructEvent.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            const mockRequest = {
                text: vi.fn().mockResolvedValue('{"test": "webhook"}'),
                headers: {
                    get: vi.fn().mockReturnValue('invalid_signature')
                }
            };

            const response = await t.action(api.functions.payments.stripeWebhook, mockRequest);

            expect(response.status).toBe(400);
            expect(response.body).toContain('Webhook signature verification failed');
        });

        it('should handle missing webhook secret', async () => {
            delete process.env.STRIPE_WEBHOOK_SECRET;

            const mockRequest = {
                text: vi.fn().mockResolvedValue('{"test": "webhook"}'),
                headers: {
                    get: vi.fn().mockReturnValue('test_signature')
                }
            };

            const response = await t.action(api.functions.payments.stripeWebhook, mockRequest);

            expect(response.status).toBe(500);
            expect(response.body).toBe('Missing STRIPE_WEBHOOK_SECRET env var');
        });

        it('should handle unhandled event types gracefully', async () => {
            const mockEvent = {
                type: 'unhandled.event.type',
                data: { object: {} }
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

            const mockRequest = {
                text: vi.fn().mockResolvedValue('{"test": "webhook"}'),
                headers: {
                    get: vi.fn().mockReturnValue('test_signature')
                }
            };

            const response = await t.action(api.functions.payments.stripeWebhook, mockRequest);

            expect(response.status).toBe(200);
            expect(response.body).toBe('Webhook received');
        });
    });
});
