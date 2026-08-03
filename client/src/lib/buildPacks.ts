/**
 * Build packs — shared by Pricing, BillingPortal, and the landing teaser.
 * Amounts must match server/payments/razorpay.ts RAZORPAY_PRICES_PAISE.
 */
export type BuildPack = {
  tier: string;
  count: number;
  priceLabel: string;
  perBuild: string;
  saveLabel?: string;
  popular?: boolean;
};

export const BUILD_PACKS: BuildPack[] = [
  { tier: "build", count: 1, priceLabel: "₹99", perBuild: "₹99 / build" },
  {
    tier: "build_3",
    count: 3,
    priceLabel: "₹249",
    perBuild: "₹83 / build",
    saveLabel: "Save ₹48",
    popular: true,
  },
  {
    tier: "build_5",
    count: 5,
    priceLabel: "₹399",
    perBuild: "₹80 / build",
    saveLabel: "Save ₹96",
  },
  {
    tier: "build_10",
    count: 10,
    priceLabel: "₹699",
    perBuild: "₹70 / build",
    saveLabel: "Save ₹291",
  },
];
