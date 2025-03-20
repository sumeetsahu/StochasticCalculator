/**
 * Utility class for formatting numbers, currency, and other values.
 */
class FormatUtil {
    /**
     * Format a number with commas for readability (without currency symbol)
     * 
     * @param {number} amount - The amount to format
     * @returns {string} Formatted number string
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', { 
            style: 'decimal', 
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    /**
     * Format a number with abbreviated values for large numbers (without currency symbol)
     * 
     * @param {number} amount - The amount to format
     * @returns {string} Formatted number string
     */
    static formatCurrencyShort(amount) {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(1) + 'K';
        } else {
            return amount.toFixed(0);
        }
    }
    
    /**
     * Format a number with commas for readability
     * 
     * @param {number} amount - The amount to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number string
     */
    static formatNumber(amount, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: decimals
        }).format(amount);
    }
    
    /**
     * Format a number with abbreviated values for large numbers
     * 
     * @param {number} amount - The amount to format
     * @returns {string} Formatted number string
     */
    static formatNumberShort(amount) {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(1) + 'K';
        } else {
            return amount.toFixed(0);
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
     * Format a date as a string
     * 
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    static formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
