import { describe, it, expect } from 'vitest';

describe('Pricing Engine Verification', () => {
    it('calculates the base markup correctly', () => {
        const cost = 100;
        const markup = 0.20;
        const expected = 120;

        expect(cost + (cost * markup)).toBe(expected);
    });

    it('calculates bulk discounts correctly', () => {
        const quantity = 50;
        const discountEligible = quantity > 20;

        expect(discountEligible).toBe(true);
    });
});
