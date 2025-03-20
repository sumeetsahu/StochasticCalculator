package com.retirement.engine;

import com.retirement.model.RetirementParameters;
import com.retirement.util.ProgressTracker;
import org.apache.commons.math3.random.MersenneTwister;
import org.apache.commons.math3.random.RandomGenerator;

import java.util.Arrays;

/**
 * Core simulation engine that implements Monte Carlo simulations
 * to model uncertainty in investment returns.
 */
public class MonteCarloEngine {
    private final RandomGenerator randomGenerator;
    
    public MonteCarloEngine() {
        // Use MersenneTwister for high-quality random number generation
        this.randomGenerator = new MersenneTwister();
    }
    
    /**
     * Generate a random monthly return based on expected return and standard deviation.
     * Uses a lognormal distribution to model investment returns.
     * 
     * @param expectedReturn The annual expected return (e.g., 0.07 for 7%)
     * @param stdDev The annual standard deviation (e.g., 0.10 for 10%)
     * @return A random monthly return
     */
    public double generateRandomReturn(double expectedReturn, double stdDev) {
        // Convert annual parameters to monthly
        double monthlyExpectedReturn = Math.pow(1 + expectedReturn, 1.0/12.0) - 1;
        double monthlyStdDev = stdDev / Math.sqrt(12);
        
        // Calculate parameters for lognormal distribution
        double mu = Math.log(1 + monthlyExpectedReturn) - 0.5 * Math.pow(monthlyStdDev, 2);
        double sigma = Math.sqrt(Math.log(1 + Math.pow(monthlyStdDev, 2) / Math.pow(1 + monthlyExpectedReturn, 2)));
        
        // Generate random normal variable
        double z = randomGenerator.nextGaussian();
        
        // Convert to lognormal and return
        return Math.exp(mu + sigma * z) - 1;
    }
    
    /**
     * Run a Monte Carlo simulation to calculate the success rate of a retirement plan.
     * 
     * @param params The retirement parameters
     * @return The success rate as a percentage (0-100)
     */
    public double calculateSuccessRate(RetirementParameters params) {
        // For basic mode, we need to calculate the required corpus first
        if (params.getCurrentAge() == 0) {
            double requiredCorpus = calculateRequiredCorpus(params);
            return simulateRetirementWithCorpus(requiredCorpus, params);
        } else {
            // For advanced mode, calculate projected corpus at retirement first
            double projectedCorpus = calculateProjectedCorpus(params);
            return simulateRetirementWithCorpus(projectedCorpus, params);
        }
    }
    
    /**
     * Calculate the projected corpus at retirement.
     * 
     * @param params The retirement parameters
     * @return The projected corpus at retirement
     */
    public double calculateProjectedCorpus(RetirementParameters params) {
        double currentCorpus = params.getCurrentCorpus();
        int yearsToRetirement = params.getYearsToRetirement();
        double annualContribution = params.getAnnualContribution();
        double expectedReturn = params.getExpectedReturn();
        
        // Project current corpus to retirement age
        double projectedCorpus = currentCorpus * Math.pow(1 + expectedReturn, yearsToRetirement);
        
        // Add contributions (assume made at the beginning of each year)
        for (int year = 1; year <= yearsToRetirement; year++) {
            projectedCorpus += annualContribution * Math.pow(1 + expectedReturn, yearsToRetirement - year);
        }
        
        return projectedCorpus;
    }
    
    /**
     * Calculate the required corpus needed for a given success rate.
     * 
     * @param params The retirement parameters
     * @return The required corpus
     */
    public double calculateRequiredCorpus(RetirementParameters params) {
        // Start with an initial estimate based on the "4% rule"
        double annualExpense = params.getAnnualExpense();
        double initialWithdrawalRate = 0.04; // 4% rule as a starting point
        double corpus = annualExpense / initialWithdrawalRate;
        
        // Binary search to find required corpus
        double lowerBound = corpus * 0.5;
        double upperBound = corpus * 3.0; // Increased upper bound for higher success rates
        double targetSuccessRate = params.getTargetSuccessRate() > 0 ? 
                                  params.getTargetSuccessRate() / 100.0 : 0.85; // Get target from params or use 85% default
        double currentSuccessRate;
        
        // Maximum iterations for binary search
        int maxIterations = 15;
        
        // Create progress tracker for the process
        ProgressTracker progressTracker = new ProgressTracker(maxIterations, "Calculating required corpus", true);
        
        System.out.println("Searching for required corpus to meet target success rate...");
        
        for (int i = 0; i < maxIterations; i++) { // Increased from 10 to 15 iterations for more precision
            // Update progress
            progressTracker.update(i + 1);
            
            currentSuccessRate = simulateRetirementWithCorpus(corpus, params) / 100.0;
            
            System.out.printf("\rIteration %d/%d: Corpus $%.2fM - Success Rate %.1f%% (Target: %.1f%%)%n", 
                             i+1, maxIterations, corpus/1_000_000, currentSuccessRate*100, targetSuccessRate*100);
            
            if (Math.abs(currentSuccessRate - targetSuccessRate) < 0.005) { // More precise target (0.5%)
                break; // Found a close enough value
            }
            
            if (currentSuccessRate < targetSuccessRate) {
                lowerBound = corpus;
                corpus = (corpus + upperBound) / 2;
            } else {
                upperBound = corpus;
                corpus = (corpus + lowerBound) / 2;
            }
        }
        
        // Final verification - ensure we meet or exceed the target success rate
        currentSuccessRate = simulateRetirementWithCorpus(corpus, params) / 100.0;
        if (currentSuccessRate < targetSuccessRate) {
            // If we're still below target, add a safety margin
            corpus *= (1.0 + (targetSuccessRate - currentSuccessRate) * 2);
            System.out.printf("\rAdding safety margin: Corpus $%.2fM%n", corpus/1_000_000);
        }
        
        System.out.printf("\rFinal corpus: $%.2fM with %.1f%% success rate%n", 
                         corpus/1_000_000, currentSuccessRate*100);
        
        return corpus;
    }
    
    /**
     * Run a retirement simulation with a specific corpus.
     * 
     * @param initialCorpus The starting corpus
     * @param params The retirement parameters
     * @return The success rate as a percentage (0-100)
     */
    public double simulateRetirementWithCorpus(double initialCorpus, RetirementParameters params) {
        int numSimulations = params.getNumSimulations();
        int retirementYears;
        
        // Determine retirement years based on mode
        if (params.getCurrentAge() == 0) {
            retirementYears = params.getRetirementPeriod();
        } else {
            retirementYears = params.getRetirementYears();
        }
        
        int retirementMonths = retirementYears * 12;
        double expectedReturn = params.getExpectedReturn();
        double stdDev = params.getStandardDeviation();
        double inflation = params.getInflation();
        double annualExpense = params.getAnnualExpense();
        double additionalIncome = params.getAdditionalRetirementIncome();
        boolean adjustForInflation = params.isAdjustForInflation();
        
        int successCount = 0;
        
        // Create progress tracker for large simulations
        ProgressTracker progressTracker = null;
        if (numSimulations >= 1000) {
            progressTracker = new ProgressTracker(numSimulations, "Calculating success rate", true);
        }
        
        for (int sim = 0; sim < numSimulations; sim++) {
            double corpus = initialCorpus;
            boolean depleted = false;
            
            for (int month = 1; month <= retirementMonths; month++) {
                int year = (month - 1) / 12;
                
                // Apply inflation adjustment if needed
                double inflationFactor = adjustForInflation ? Math.pow(1 + inflation, year) : 1.0;
                double monthlyExpense = ((annualExpense * inflationFactor) - additionalIncome) / 12.0;
                monthlyExpense = Math.max(0, monthlyExpense);
                
                // Generate random monthly return
                double monthlyReturn = generateRandomReturn(expectedReturn, stdDev);
                
                // Update corpus
                corpus = corpus * (1 + monthlyReturn) - monthlyExpense;
                
                if (corpus <= 0) {
                    depleted = true;
                    break;
                }
            }
            
            if (!depleted) {
                successCount++;
            }
            
            // Update progress tracker
            if (progressTracker != null) {
                progressTracker.update(sim + 1);
            }
        }
        
        return (double) successCount / numSimulations * 100.0;
    }
    
    /**
     * Run a simulation and return the final corpus values for all simulations.
     * 
     * @param initialCorpus The starting corpus
     * @param params The retirement parameters
     * @return Array of final corpus values for each simulation
     */
    public double[] simulateRetirementAndReturnCorpusValues(double initialCorpus, RetirementParameters params) {
        int numSimulations = params.getNumSimulations();
        int retirementYears;
        
        // Determine retirement years based on mode
        if (params.getCurrentAge() == 0) {
            retirementYears = params.getRetirementPeriod();
        } else {
            retirementYears = params.getRetirementYears();
        }
        
        int retirementMonths = retirementYears * 12;
        double expectedReturn = params.getExpectedReturn();
        double stdDev = params.getStandardDeviation();
        double inflation = params.getInflation();
        double annualExpense = params.getAnnualExpense();
        double additionalIncome = params.getAdditionalRetirementIncome();
        boolean adjustForInflation = params.isAdjustForInflation();
        
        double[] finalCorpusValues = new double[numSimulations];
        
        // Create progress tracker for large simulations
        ProgressTracker progressTracker = null;
        if (numSimulations >= 1000) {
            progressTracker = new ProgressTracker(numSimulations, "Running retirement simulation", true);
        }
        
        for (int sim = 0; sim < numSimulations; sim++) {
            double corpus = initialCorpus;
            
            for (int month = 1; month <= retirementMonths; month++) {
                int year = (month - 1) / 12;
                
                // Apply inflation adjustment if needed
                double inflationFactor = adjustForInflation ? Math.pow(1 + inflation, year) : 1.0;
                double monthlyExpense = ((annualExpense * inflationFactor) - additionalIncome) / 12.0;
                monthlyExpense = Math.max(0, monthlyExpense);
                
                // Generate random monthly return
                double monthlyReturn = generateRandomReturn(expectedReturn, stdDev);
                
                // Update corpus
                corpus = corpus * (1 + monthlyReturn) - monthlyExpense;
                
                if (corpus <= 0) {
                    corpus = 0;
                    break;
                }
            }
            
            finalCorpusValues[sim] = corpus;
            
            // Update progress tracker
            if (progressTracker != null) {
                progressTracker.update(sim + 1);
            }
        }
        
        return finalCorpusValues;
    }
    
    /**
     * Run a simulation and return corpus values up to a specific age, including pre-retirement phase.
     * 
     * @param initialCorpus The starting corpus
     * @param params The retirement parameters
     * @param targetAge The target age to simulate up to
     * @return Array of corpus values at the target age for all simulations
     */
    public double[] simulateCorpusValuesAtAge(double initialCorpus, RetirementParameters params, int targetAge) {
        return simulateCorpusValuesAtAge(initialCorpus, params, targetAge, false);
    }
    
    /**
     * Run a simulation and return corpus values up to a specific age, with control over contribution application.
     * 
     * @param initialCorpus The starting corpus
     * @param params The retirement parameters
     * @param targetAge The target age to simulate up to
     * @param applyContributionUpfront Whether to apply the contribution as a lump sum at the beginning of the period
     * @return Array of corpus values at the target age for all simulations
     */
    public double[] simulateCorpusValuesAtAge(double initialCorpus, RetirementParameters params, int targetAge, 
                                             boolean applyContributionUpfront) {
        int numSimulations = params.getNumSimulations();
        int currentAge = params.getCurrentAge();
        int retirementAge = params.getRetirementAge();
        double annualContribution = params.getAnnualContribution();
        double annualExpense = params.getAnnualExpense();
        double additionalIncome = params.getAdditionalRetirementIncome();
        double expectedReturn = params.getExpectedReturn();
        double stdDev = params.getStandardDeviation();
        double inflation = params.getInflation();
        boolean adjustForInflation = params.isAdjustForInflation();
        
        // For first year only, we can simplify and use direct simulation
        if (targetAge == currentAge) {
            // DEBUG: Return from initial approach 
            return simulateCorpusAtAgeFromValues(
                new double[numSimulations], // Start with all zeros
                initialCorpus + annualContribution, // Add the full corpus + contribution 
                0, // No withdrawal in first year
                expectedReturn, 
                stdDev,
                numSimulations
            );
        }
        
        if (targetAge < currentAge) {
            throw new IllegalArgumentException("Target age cannot be less than current age");
        }
        
        double[] corpusValues = new double[numSimulations];
        
        // Create progress tracker for large simulations
        ProgressTracker progressTracker = null;
        if (numSimulations >= 1000) {
            progressTracker = new ProgressTracker(numSimulations, "Running simulation for age " + targetAge, true);
        }
        
        // Debug output for first year
        if (targetAge == currentAge) {
            System.out.println("\nDEBUG - MonteCarloEngine Simulation for Age " + targetAge + ":");
            System.out.println("Initial Corpus: " + initialCorpus);
            System.out.println("Annual Contribution: " + annualContribution);
            System.out.println("Annual Expense: " + annualExpense);
            System.out.println("Additional Income: " + additionalIncome);
            System.out.println("Expected Return: " + expectedReturn);
            System.out.println("Std Dev: " + stdDev);
            System.out.println("Apply Contribution Upfront: " + applyContributionUpfront);
        }
        
        for (int sim = 0; sim < numSimulations; sim++) {
            double corpus = initialCorpus;
            
            // Simulate month by month up to the target age
            for (int age = currentAge; age < targetAge; age++) {
                boolean isRetired = age >= retirementAge;
                
                // If we should apply contribution upfront for this age, do it now
                if (applyContributionUpfront) {
                    if (!isRetired) {
                        // In pre-retirement: add annual contribution at start of year
                        corpus += annualContribution;
                    } else if (additionalIncome > 0) {
                        // In retirement: add additional income at start of year if positive
                        corpus += additionalIncome;
                    }
                }
                
                for (int month = 0; month < 12; month++) {
                    // Calculate years since start for inflation
                    int yearsSinceStart = age - currentAge;
                    
                    // Generate random monthly return
                    double monthlyReturn = generateRandomReturn(expectedReturn, stdDev);
                    
                    // Apply monthly return
                    corpus = corpus * (1 + monthlyReturn);
                    
                    // Add contribution or subtract expenses depending on retirement status
                    if (!applyContributionUpfront) {
                        // Only apply monthly contribution/income if we didn't do it upfront
                        if (isRetired) {
                            // In retirement: withdraw expenses
                            double inflationFactor = adjustForInflation ? Math.pow(1 + inflation, yearsSinceStart) : 1.0;
                            double monthlyExpense = ((annualExpense * inflationFactor) - additionalIncome) / 12.0;
                            monthlyExpense = Math.max(0, monthlyExpense);
                            if (monthlyExpense > 0) {
                                corpus -= monthlyExpense;
                            }
                        } else {
                            // Pre-retirement: add contribution
                            corpus += annualContribution / 12.0;
                        }
                    } else {
                        // If we applied contribution upfront, only handle expenses here
                        if (isRetired) {
                            // In retirement: withdraw expenses (already handled additional income upfront)
                            double inflationFactor = adjustForInflation ? Math.pow(1 + inflation, yearsSinceStart) : 1.0;
                            double monthlyExpense = (annualExpense * inflationFactor) / 12.0;
                            if (monthlyExpense > 0) {
                                corpus -= monthlyExpense;
                            }
                        }
                    }
                    
                    // Check if corpus is depleted
                    if (corpus <= 0) {
                        corpus = 0;
                        break;
                    }
                }
                
                // If corpus depleted, no need to continue simulation
                if (corpus <= 0) {
                    break;
                }
            }
            
            corpusValues[sim] = corpus;
            
            // Update progress tracker
            if (progressTracker != null) {
                progressTracker.update(sim + 1);
            }
        }
        
        return corpusValues;
    }
    
    /**
     * Simulate corpus values for a single year starting from a set of initial values.
     * This method is used for continuing simulations from previous years.
     * 
     * @param startingCorpusValues Array of corpus values to start with
     * @param contribution Annual contribution to add
     * @param withdrawal Annual withdrawal to subtract
     * @param expectedReturn Expected annual return
     * @param stdDev Annual standard deviation
     * @param numSimulations Number of simulations to run
     * @return Array of corpus values after simulation
     */
    public double[] simulateCorpusAtAgeFromValues(double[] startingCorpusValues, double contribution, double withdrawal,
                                                 double expectedReturn, double stdDev, int numSimulations) {
        double[] resultCorpusValues = new double[numSimulations];
        
        // Log-normal parameters
        double mu = Math.log(1 + expectedReturn) - 0.5 * Math.pow(stdDev, 2);
        double sigma = Math.sqrt(Math.log(1 + Math.pow(stdDev, 2) / Math.pow(1 + expectedReturn, 2)));
        
        for (int sim = 0; sim < numSimulations; sim++) {
            double corpus = startingCorpusValues[sim];
            
            // Apply contribution at the start of the year
            corpus += contribution;
            
            // Calculate the annual return for this simulation
            double annualReturn = 0.0;
            
            // Simulate a full year of monthly returns and compound them
            for (int month = 0; month < 12; month++) {
                // Generate random monthly return using log-normal distribution
                double z = randomGenerator.nextGaussian();
                double monthlyReturn = Math.exp(mu/12 + sigma*Math.sqrt(1.0/12) * z) - 1;
                
                // Apply monthly return and compound them
                corpus *= (1 + monthlyReturn);
            }
            
            // Apply annual withdrawal at the end
            corpus -= withdrawal;
            
            // Ensure corpus can't go negative
            corpus = Math.max(0, corpus);
            
            resultCorpusValues[sim] = corpus;
        }
        
        return resultCorpusValues;
    }
    
    /**
     * Get the random generator used by this engine.
     * 
     * @return The random generator
     */
    public RandomGenerator getRandomGenerator() {
        return randomGenerator;
    }
    
    /**
     * Calculate percentiles from an array of corpus values.
     * Uses linear interpolation for more accurate percentile calculation.
     * 
     * @param corpusValues Array of corpus values
     * @param percentile The percentile to calculate (0-100)
     * @return The value at the specified percentile
     */
    public double calculatePercentile(double[] corpusValues, double percentile) {
        if (corpusValues == null || corpusValues.length == 0) {
            return 0.0;
        }
        
        // Make a copy and sort the array
        double[] sortedValues = Arrays.copyOf(corpusValues, corpusValues.length);
        Arrays.sort(sortedValues);
        
        if (percentile <= 0) {
            return sortedValues[0];
        }
        if (percentile >= 100) {
            return sortedValues[sortedValues.length - 1];
        }
        
        // Calculate the rank
        double rank = percentile / 100.0 * (sortedValues.length - 1);
        
        // Calculate the lower and upper indices
        int lowerIndex = (int) Math.floor(rank);
        int upperIndex = (int) Math.ceil(rank);
        
        // If they're the same, just return the value
        if (lowerIndex == upperIndex) {
            return sortedValues[lowerIndex];
        }
        
        // Calculate the fractional part for interpolation
        double fraction = rank - lowerIndex;
        
        // Perform linear interpolation
        return sortedValues[lowerIndex] + fraction * (sortedValues[upperIndex] - sortedValues[lowerIndex]);
    }
}
