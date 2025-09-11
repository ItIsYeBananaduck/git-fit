// Centralized pricing configuration for Web and iOS
// Prices are duplicated from business spec; amounts are user-visible and not authoritative for billing
// Actual billing amounts should be determined by Stripe price IDs or IAP products.

export const PRICING = {
  web: {
    consumerMonthly: { label: "$15 / month", amountDisplay: "$15/mo" },
    consumerAnnual: { label: "$120 / year", amountDisplay: "$120/yr" },
  },
  ios: {
    consumerMonthly: { label: "$20 / month", amountDisplay: "$20/mo" },
  },
  trainerPro: {
    monthly: { label: "$20 / month", amountDisplay: "$20/mo" },
    notes: "B2B SaaS (Trainer Pro) is Stripe-only; not subject to Apple IAP.",
  },
} as const;

export type PricingConfig = typeof PRICING;
