import { z } from 'zod';

const money = z.number().finite().nonnegative();
export const publicSettingsSchema = z.object({
  hotline: z.string(), zalo: z.string(), email: z.string(), address: z.string(),
  shippingFee: money, freeShippingThreshold: money,
  businessConfig: z.object({
    appliances: z.array(z.object({ id: z.string(), name: z.string(), active: z.boolean(), issues: z.array(z.string()), priceMin: money, priceMax: money }).refine(item => item.priceMax >= item.priceMin)),
    serviceAreas: z.array(z.object({ id: z.string(), name: z.string(), active: z.boolean(), travelFee: money })),
    timeSlots: z.array(z.object({ id: z.string(), label: z.string(), active: z.boolean() })),
    pricing: z.object({ inspectionFee: money, emergencySurcharge: money, showPriceRanges: z.boolean(), disclaimer: z.string() }),
  }),
});

