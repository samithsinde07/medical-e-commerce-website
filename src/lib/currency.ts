/**
 * Format price in Indian Rupees (INR)
 */
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Convert USD to INR (for future multi-currency support)
 * Current rate: 1 USD = 83 INR (can be made dynamic later)
 */
export const convertToINR = (usdAmount: number, rate: number = 83): number => {
  return usdAmount * rate;
};
