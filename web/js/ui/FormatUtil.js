/**
 * Utility class for formatting numbers, currency, and other values.
 */
class FormatUtil {
    /**
     * Format a number as currency with dollar sign and commas
     * 
     * @param {number} amount - The amount to format
     * @returns {string} Formatted currency string
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    /**
     * Format a number as currency with abbreviated values for large numbers
     * 
     * @param {number} amount - The amount to format
     * @returns {string} Formatted currency string
     */
    static formatCurrencyShort(amount) {
        if (amount >= 1000000) {
            return '$' + (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return '$' + (amount / 1000).toFixed(1) + 'K';
        } else {
            return '$' + amount.toFixed(0);
        }
    }
    
    /**
     * Format a number as a percentage
     * 
     * @param {number} value - The value to format (e.g., 0.05 for 5%)
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted percentage string
     */
    static formatPercent(value, decimals = 1) {
        return (value * 100).toFixed(decimals) + '%';
    }
    
    /**
     * Format a number with commas
     * 
     * @param {number} amount - The amount to format
     * @returns {string} Formatted number string
     */
    static formatNumber(amount) {
        return new Intl.NumberFormat('en-US').format(amount);
    }
    
    /**
     * Format a date in a friendly format
     * 
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    static formatDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
}
