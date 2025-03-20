package com.retirement.util;

import java.text.NumberFormat;
import java.util.Currency;
import java.util.Locale;

/**
 * Configuration class for locale and currency settings.
 * Provides centralized locale-aware currency formatting and configuration.
 */
public class LocaleConfig {
    private static Locale currentLocale = new Locale.Builder().setLanguage("en").setRegion("IN").build(); // Default is English-India
    private static NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(currentLocale);
    
    /**
     * Get the current locale.
     * @return Current locale
     */
    public static Locale getCurrentLocale() {
        return currentLocale;
    }
    
    /**
     * Set the locale using a Locale object.
     * @param locale The locale to set
     */
    public static void setLocale(Locale locale) {
        currentLocale = locale;
        currencyFormatter = NumberFormat.getCurrencyInstance(currentLocale);
    }
    
    /**
     * Set the locale using a language tag string.
     * @param languageTag Language tag in BCP 47 format (e.g., "en-US", "fr-FR", "hi-IN")
     */
    public static void setLocale(String languageTag) {
        currentLocale = Locale.forLanguageTag(languageTag);
        currencyFormatter = NumberFormat.getCurrencyInstance(currentLocale);
    }
    
    /**
     * Get the current currency.
     * @return Currency for the current locale
     */
    public static Currency getCurrency() {
        return Currency.getInstance(currentLocale);
    }
    
    /**
     * Get the currency symbol for the current locale.
     * @return Currency symbol as a string
     */
    public static String getCurrencySymbol() {
        return Currency.getInstance(currentLocale).getSymbol(currentLocale);
    }
    
    /**
     * Get the currency formatter for the current locale.
     * @return NumberFormat configured for currency
     */
    public static NumberFormat getCurrencyFormatter() {
        return currencyFormatter;
    }
    
    /**
     * Format a money value according to the current locale.
     * Formats in lakhs and crores for Indian locale, and in M/B for others.
     * 
     * @param value The money value to format
     * @return Formatted money string
     */
    public static String formatMoney(double value) {
        // Check if the locale is Indian
        if (currentLocale.getCountry().equals("IN")) {
            // Use Indian number format (lakhs and crores)
            if (value >= 10000000) { // 1 crore (1,00,00,000) or more
                return String.format("%s%.2f Cr", 
                       currencyFormatter.getCurrency().getSymbol(), 
                       value / 10000000);
            } else if (value >= 100000) { // 1 lakh (1,00,000) or more
                return String.format("%s%.2f L", 
                       currencyFormatter.getCurrency().getSymbol(), 
                       value / 100000);
            }
        } else {
            // For non-Indian locales, use millions format for large numbers
            if (value >= 1000000) {
                return String.format("%s%.2fM", 
                       currencyFormatter.getCurrency().getSymbol(), 
                       value / 1000000);
            }
        }
        
        // For smaller values, use standard currency formatting
        return currencyFormatter.format(value);
    }
}
