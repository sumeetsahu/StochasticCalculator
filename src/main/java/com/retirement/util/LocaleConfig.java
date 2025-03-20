package com.retirement.util;

import java.text.NumberFormat;
import java.util.Currency;
import java.util.Locale;

/**
 * Configuration class for locale and currency settings.
 * Provides centralized locale-aware currency formatting and configuration.
 */
public class LocaleConfig {
    private static Locale currentLocale = new Locale.Builder().setLanguage("en").setRegion("IN").build(); // Default locale is now English-India
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
     * @param value The money value to format
     * @return Formatted money string
     */
    public static String formatMoney(double value) {
        if (value >= 1_000_000) {
            // For large values, format with millions
            return currencyFormatter.format(value / 1_000_000) + "M";
        } else {
            return currencyFormatter.format(value);
        }
    }
}
