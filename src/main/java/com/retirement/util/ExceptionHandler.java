package com.retirement.util;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Utility class for handling exceptions in a standardized way.
 */
public class ExceptionHandler {
    private static final Logger LOGGER = Logger.getLogger(ExceptionHandler.class.getName());
    
    /**
     * Handle exceptions with a user-friendly message.
     * 
     * @param e The exception to handle
     * @param context The context in which the exception occurred
     * @param userMessage The user-friendly message to display
     */
    public static void handle(Exception e, String context, String userMessage) {
        LOGGER.log(Level.SEVERE, "Error in " + context + ": " + e.getMessage(), e);
        System.err.println(userMessage);
    }
    
    /**
     * Handle runtime exceptions and provide a default error message.
     * 
     * @param e The exception to handle
     * @param context The context in which the exception occurred
     */
    public static void handle(RuntimeException e, String context) {
        handle(e, context, "An unexpected error occurred. Please try again.");
    }
    
    /**
     * Log a warning message.
     * 
     * @param message The warning message to log
     */
    public static void logWarning(String message) {
        LOGGER.log(Level.WARNING, message);
    }
    
    /**
     * Log an informational message.
     * 
     * @param message The informational message to log
     */
    public static void logInfo(String message) {
        LOGGER.log(Level.INFO, message);
    }
}
