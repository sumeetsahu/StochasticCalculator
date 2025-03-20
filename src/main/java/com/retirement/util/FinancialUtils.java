package com.retirement.util;

import java.text.DecimalFormat;

/**
 * Utility class for financial calculations and formatting.
 */
public class FinancialUtils {
    private static final DecimalFormat MONEY_FORMAT = new DecimalFormat("$#,##0.00");
    private static final DecimalFormat PERCENT_FORMAT = new DecimalFormat("0.0%");
    
    /**
     * Format a monetary value.
     * 
     * @param value The value to format
     * @return Formatted string with currency symbol
     */
    public static String formatMoney(double value) {
        if (value >= 1_000_000) {
            return String.format("$%,.2fM", value / 1_000_000);
        } else {
            return MONEY_FORMAT.format(value);
        }
    }
    
    /**
     * Format a percentage value.
     * 
     * @param value The value to format (as a decimal, e.g., 0.07 for 7%)
     * @return Formatted string with percentage symbol
     */
    public static String formatPercent(double value) {
        return PERCENT_FORMAT.format(value);
    }
    
    /**
     * Calculate the future value with compound interest.
     * 
     * @param presentValue The present value
     * @param rate The annual interest rate (as a decimal, e.g., 0.07 for 7%)
     * @param years The number of years
     * @return The future value
     */
    public static double calculateFutureValue(double presentValue, double rate, int years) {
        return presentValue * Math.pow(1 + rate, years);
    }
    
    /**
     * Calculate the present value of future value with compound interest.
     * 
     * @param futureValue The future value
     * @param rate The annual interest rate (as a decimal, e.g., 0.07 for 7%)
     * @param years The number of years
     * @return The present value
     */
    public static double calculatePresentValue(double futureValue, double rate, int years) {
        return futureValue / Math.pow(1 + rate, years);
    }
    
    /**
     * Calculate the future value of an annuity (periodic payments).
     * 
     * @param payment The periodic payment amount
     * @param rate The annual interest rate (as a decimal, e.g., 0.07 for 7%)
     * @param periods The number of periods (years)
     * @return The future value of the annuity
     */
    public static double calculateAnnuityFutureValue(double payment, double rate, int periods) {
        return payment * ((Math.pow(1 + rate, periods) - 1) / rate);
    }
    
    /**
     * Calculate the withdrawal amount based on the 4% rule.
     * 
     * @param corpus The retirement corpus
     * @return The safe annual withdrawal amount
     */
    public static double calculateSafeWithdrawal(double corpus) {
        return corpus * 0.04;
    }
    
    /**
     * Calculate the initial withdrawal rate.
     * 
     * @param annualExpense The annual expense
     * @param corpus The retirement corpus
     * @return The initial withdrawal rate as a percentage
     */
    public static double calculateInitialWithdrawalRate(double annualExpense, double corpus) {
        return annualExpense / corpus;
    }
    
    /**
     * Calculate the inflation-adjusted value.
     * 
     * @param currentValue The current value
     * @param inflationRate The annual inflation rate (as a decimal, e.g., 0.03 for 3%)
     * @param years The number of years
     * @return The inflation-adjusted value
     */
    public static double calculateInflationAdjustedValue(double currentValue, double inflationRate, int years) {
        return currentValue * Math.pow(1 + inflationRate, years);
    }
}
