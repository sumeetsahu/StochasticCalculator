package com.retirement.util;

/**
 * Utility class for validating user inputs.
 */
public class InputValidator {
    
    /**
     * Validate a numerical input against a range.
     * 
     * @param value The value to validate
     * @param min The minimum allowed value
     * @param max The maximum allowed value
     * @param name The name of the parameter (for error message)
     * @return The validated value (unchanged if valid)
     * @throws IllegalArgumentException if the value is outside the allowed range
     */
    public static double validateRange(double value, double min, double max, String name) {
        if (value < min || value > max) {
            throw new IllegalArgumentException(
                String.format("%s must be between %.2f and %.2f", name, min, max)
            );
        }
        return value;
    }
    
    /**
     * Validate an integer input against a range.
     * 
     * @param value The value to validate
     * @param min The minimum allowed value
     * @param max The maximum allowed value
     * @param name The name of the parameter (for error message)
     * @return The validated value (unchanged if valid)
     * @throws IllegalArgumentException if the value is outside the allowed range
     */
    public static int validateRange(int value, int min, int max, String name) {
        if (value < min || value > max) {
            throw new IllegalArgumentException(
                String.format("%s must be between %d and %d", name, min, max)
            );
        }
        return value;
    }
    
    /**
     * Validate that a retirement age is greater than current age.
     * 
     * @param currentAge The current age
     * @param retirementAge The retirement age
     * @return The validated retirement age (unchanged if valid)
     * @throws IllegalArgumentException if the retirement age is not greater than the current age
     */
    public static int validateRetirementAge(int currentAge, int retirementAge) {
        if (retirementAge <= currentAge) {
            throw new IllegalArgumentException(
                "Retirement age must be greater than current age"
            );
        }
        return retirementAge;
    }
    
    /**
     * Validate that a life expectancy is greater than retirement age.
     * 
     * @param retirementAge The retirement age
     * @param lifeExpectancy The life expectancy
     * @return The validated life expectancy (unchanged if valid)
     * @throws IllegalArgumentException if the life expectancy is not greater than the retirement age
     */
    public static int validateLifeExpectancy(int retirementAge, int lifeExpectancy) {
        if (lifeExpectancy <= retirementAge) {
            throw new IllegalArgumentException(
                "Life expectancy must be greater than retirement age"
            );
        }
        return lifeExpectancy;
    }
    
    /**
     * Validate the consistency of a set of retirement parameters.
     * 
     * @param currentAge The current age
     * @param retirementAge The retirement age
     * @param lifeExpectancy The life expectancy
     * @throws IllegalArgumentException if the parameters are inconsistent
     */
    public static void validateAgeParameters(int currentAge, int retirementAge, int lifeExpectancy) {
        validateRange(currentAge, Constants.MIN_AGE, Constants.MAX_AGE, "Current age");
        validateRange(retirementAge, Constants.MIN_AGE, Constants.MAX_AGE, "Retirement age");
        validateRange(lifeExpectancy, Constants.MIN_AGE, Constants.MAX_AGE, "Life expectancy");
        validateRetirementAge(currentAge, retirementAge);
        validateLifeExpectancy(retirementAge, lifeExpectancy);
    }
    
    /**
     * Validate financial parameters.
     * 
     * @param expectedReturn The expected return
     * @param standardDeviation The standard deviation
     * @param inflation The inflation rate
     * @throws IllegalArgumentException if any parameter is invalid
     */
    public static void validateFinancialParameters(double expectedReturn, double standardDeviation, double inflation) {
        validateRange(expectedReturn, Constants.MIN_EXPECTED_RETURN, Constants.MAX_EXPECTED_RETURN, "Expected return");
        validateRange(standardDeviation, Constants.MIN_STANDARD_DEVIATION, Constants.MAX_STANDARD_DEVIATION, "Standard deviation");
        validateRange(inflation, Constants.MIN_INFLATION, Constants.MAX_INFLATION, "Inflation rate");
    }
    
    /**
     * Validate simulation parameters.
     * 
     * @param numSimulations The number of simulations
     * @return The validated number of simulations (unchanged if valid)
     * @throws IllegalArgumentException if the number of simulations is invalid
     */
    public static int validateSimulationParameters(int numSimulations) {
        return validateRange(numSimulations, Constants.MIN_NUM_SIMULATIONS, Constants.MAX_NUM_SIMULATIONS, "Number of simulations");
    }
}
