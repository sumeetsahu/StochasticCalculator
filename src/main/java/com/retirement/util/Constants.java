package com.retirement.util;

/**
 * Constants used throughout the retirement calculator application.
 */
public class Constants {
    // Simulation constants
    public static final int DEFAULT_NUM_SIMULATIONS = 5000;
    public static final int MIN_NUM_SIMULATIONS = 1000;
    public static final int MAX_NUM_SIMULATIONS = 10000;
    
    // Financial constants
    public static final double DEFAULT_EXPECTED_RETURN = 0.07; // 7%
    public static final double DEFAULT_STANDARD_DEVIATION = 0.10; // 10%
    public static final double DEFAULT_INFLATION = 0.03; // 3%
    public static final double DEFAULT_TARGET_SUCCESS_RATE = 85.0; // 85%
    
    // Default retirement parameters - Basic mode
    public static final double DEFAULT_ANNUAL_EXPENSE = 60000.0;
    public static final int DEFAULT_RETIREMENT_PERIOD = 30;
    
    // Default retirement parameters - Advanced mode
    public static final int DEFAULT_CURRENT_AGE = 40;
    public static final int DEFAULT_RETIREMENT_AGE = 65;
    public static final int DEFAULT_LIFE_EXPECTANCY = 90;
    public static final double DEFAULT_CURRENT_CORPUS = 500000.0;
    public static final double DEFAULT_ANNUAL_CONTRIBUTION = 30000.0;
    public static final double DEFAULT_ADDITIONAL_INCOME = 20000.0;
    
    // File paths and formats
    public static final String REPORT_FILE_FORMAT = "RetirementReport_%s_%s.txt";
    public static final String DATE_FORMAT = "yyyyMMdd_HHmmss";
    
    // Validation constants
    public static final int MIN_RETIREMENT_PERIOD = 5;
    public static final int MAX_RETIREMENT_PERIOD = 50;
    public static final int MIN_AGE = 18;
    public static final int MAX_AGE = 100;
    public static final double MIN_EXPECTED_RETURN = -0.02; // -2%
    public static final double MAX_EXPECTED_RETURN = 0.15; // 15%
    public static final double MIN_STANDARD_DEVIATION = 0.01; // 1%
    public static final double MAX_STANDARD_DEVIATION = 0.30; // 30%
    public static final double MIN_INFLATION = 0.0; // 0%
    public static final double MAX_INFLATION = 0.10; // 10%
    
    // UI constants
    public static final String HEADER_LINE = "====================================================";
    public static final String BASIC_MODE_TITLE = "BASIC MODE: CORPUS CALCULATION";
    public static final String ADVANCED_MODE_TITLE = "ADVANCED MODE: PERSONALIZED PLANNING";
    public static final String HELP_TITLE = "HELP AND INFORMATION";
    
    private Constants() {
        // Private constructor to prevent instantiation
    }
}
