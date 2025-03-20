package com.retirement.engine;

import com.retirement.model.RetirementParameters;
import com.retirement.model.YearlyTracking;
import com.retirement.util.ProgressTracker;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Class responsible for year-by-year tracking of retirement corpus evolution.
 */
public class CorpusTracker {
    private final MonteCarloEngine monteCarloEngine;
    
    public CorpusTracker() {
        this.monteCarloEngine = new MonteCarloEngine();
    }
    
    /**
     * Generate year-by-year tracking data for retirement corpus evolution.
     * 
     * @param params The retirement parameters
     * @return List of YearlyTracking objects containing tracking data
     */
    public List<YearlyTracking> generateYearByYearTracking(RetirementParameters params) {
        List<YearlyTracking> trackingData = new ArrayList<>();
        
        // For advanced mode
        int currentAge = params.getCurrentAge();
        int retirementAge = params.getRetirementAge();
        int lifeExpectancy = params.getLifeExpectancy();
        double currentCorpus = params.getCurrentCorpus();
        double annualContribution = params.getAnnualContribution();
        double additionalRetirementIncome = params.getAdditionalRetirementIncome();
        double annualExpense = params.getAnnualExpense();
        double expectedReturn = params.getExpectedReturn();
        double inflation = params.getInflation();
        int numSimulations = params.getNumSimulations();
        
        // Calculate total years to track
        int totalYears = lifeExpectancy - currentAge + 1;
        
        // Create a progress tracker for the projection phase
        ProgressTracker progressTracker = new ProgressTracker(totalYears, "Generating year-by-year projections", true);
        
        // Value to keep track of previous year's end corpus (median from simulations)
        double previousYearEndCorpus = currentCorpus;
        
        // Process one year at a time, running simulations after each year
        for (int age = currentAge; age <= lifeExpectancy; age++) {
            YearlyTracking yearly = new YearlyTracking(age);
            
            // Calculate contribution or additional income
            if (age < retirementAge) {
                yearly.setContribution(annualContribution);
                yearly.setWithdrawal(0);
                
                // Set expected expense (still tracked but not withdrawn)
                double inflationAdjustment = Math.pow(1 + inflation, age - currentAge);
                yearly.setExpectedExpense(annualExpense * inflationAdjustment);
            } else {
                yearly.setContribution(additionalRetirementIncome);
                
                // Calculate withdrawal (only during retirement)
                double inflationAdjustment = Math.pow(1 + inflation, age - currentAge);
                double inflatedExpense = annualExpense * inflationAdjustment;
                yearly.setWithdrawal(inflatedExpense);
                
                // Expected expense is the same as withdrawal during retirement
                yearly.setExpectedExpense(inflatedExpense);
            }
            
            // For first year, start corpus is just the initial corpus
            // For subsequent years, start corpus is median end corpus from last year + this year's contribution
            if (age == currentAge) {
                yearly.setStartCorpus(currentCorpus);
            } else {
                // Start corpus includes this year's contribution
                yearly.setStartCorpus(previousYearEndCorpus + yearly.getContribution());
            }
            
            // Calculate deterministic returns - this will be used just for the "Returns" column
            // Returns are calculated based on previous year's end corpus (before adding this year's contribution)
            double corpusBeforeContribution = (age == currentAge) ? currentCorpus : previousYearEndCorpus;
            yearly.setReturns(corpusBeforeContribution * expectedReturn);
            
            // Calculate temporary deterministic end corpus (will be replaced with median)
            double deterministicEndCorpus = yearly.getStartCorpus() + yearly.getReturns() - yearly.getWithdrawal();
            deterministicEndCorpus = Math.max(0, deterministicEndCorpus);
            
            // Add to tracking data
            trackingData.add(yearly);
            
            // Run stochastic simulation for this specific year
            System.out.printf("\rSimulating age %d of %d...%n", age, params.getLifeExpectancy());
            
            // Calculate stochastic projections for this specific year
            double startingCorpus = yearly.getStartCorpus() - yearly.getContribution(); // Remove contribution as it's added in simulation
            double[] corpusValues;
            
            if (age == currentAge) {
                // First year
                corpusValues = monteCarloEngine.simulateCorpusValuesAtAge(
                    startingCorpus, params, age, true // Apply contributions upfront
                );
            } else {
                // Subsequent years - use the same simulation method but with proper parameters
                corpusValues = monteCarloEngine.simulateCorpusAtAgeFromValues(
                    new double[numSimulations], // Start with all zeros (fresh simulation)
                    startingCorpus + yearly.getContribution(), // Full corpus including contribution
                    yearly.getWithdrawal(),
                    params.getExpectedReturn(), 
                    params.getStandardDeviation(),
                    numSimulations
                );
            }
            
            // Set corpus values for this year
            yearly.setCorpusValues(corpusValues);
            
            // Calculate percentiles
            yearly.setPercentile5(monteCarloEngine.calculatePercentile(corpusValues, 5));
            yearly.setPercentile95(monteCarloEngine.calculatePercentile(corpusValues, 95));
            
            // Calculate and set the median (50th percentile) as the end corpus
            double medianCorpus = monteCarloEngine.calculatePercentile(corpusValues, 50);
            yearly.setEndCorpus(medianCorpus);
            
            // Store median for next year's calculations
            previousYearEndCorpus = medianCorpus;
            
            // Calculate depletion risk and success rate
            int depleted = 0;
            for (double value : corpusValues) {
                if (value <= 0) {
                    depleted++;
                }
            }
            
            yearly.setDepletionRisk((double) depleted / numSimulations * 100);
            yearly.setSuccessRate(100 - yearly.getDepletionRisk());
            
            // Update progress tracker
            progressTracker.update(age - currentAge + 1);
        }
        
        System.out.println("\nYear-by-year projections complete.");
        return trackingData;
    }
    
    /**
     * Run stochastic projections for each year in the tracking data.
     * 
     * @param trackingData List of YearlyTracking objects
     * @param params The retirement parameters
     */
    private void runStochasticProjections(List<YearlyTracking> trackingData, RetirementParameters params) {
        int numSimulations = params.getNumSimulations();
        int currentAge = params.getCurrentAge();
        int retirementAge = params.getRetirementAge();
        double currentCorpus = params.getCurrentCorpus();
        double annualContribution = params.getAnnualContribution();
        double additionalRetirementIncome = params.getAdditionalRetirementIncome();
        double annualExpense = params.getAnnualExpense();
        double expectedReturn = params.getExpectedReturn();
        double stdDev = params.getStandardDeviation();
        double inflation = params.getInflation();
        
        // Create a progress tracker for the stochastic projection phase
        int totalYears = trackingData.size();
        ProgressTracker progressTracker = new ProgressTracker(totalYears, "Running stochastic projections", true);
        int yearCount = 0;
        
        // Keep track of the previous year's end corpus values for use in simulations
        double[] previousYearEndCorpus = null;
        
        // Run simulations for each year
        for (YearlyTracking yearly : trackingData) {
            int age = yearly.getAge();
            
            // Show which age is being simulated
            System.out.printf("\rSimulating age %d of %d...%n", age, params.getLifeExpectancy());
            
            // For the first year, let's handle it specially to debug the issue
            double[] corpusValues;
            if (age == currentAge) {
                // First year - we'll manually apply the expected operations for clear debugging
                corpusValues = new double[numSimulations];
                double startCorpus = yearly.getStartCorpus() - yearly.getContribution(); // Start with corpus without contribution
                
                System.out.println("\nDEBUG - First Year Calculation (Custom):");
                System.out.println("Start Corpus (before contribution): " + startCorpus);
                System.out.println("Contribution: " + yearly.getContribution());
                System.out.println("Expected Return: " + params.getExpectedReturn());
                
                // Expected value with simple deterministic calculation
                double expectedWithDeterministic = startCorpus + yearly.getContribution() + 
                            (startCorpus * params.getExpectedReturn());
                System.out.println("Expected End Corpus (deterministic): " + expectedWithDeterministic);
                
                // Now run actual simulations with lognormal distribution
                double mu = Math.log(1 + expectedReturn) - 0.5 * Math.pow(stdDev, 2);
                double sigma = Math.sqrt(Math.log(1 + Math.pow(stdDev, 2) / Math.pow(1 + expectedReturn, 2)));
                
                for (int i = 0; i < numSimulations; i++) {
                    double simulatedCorpus = startCorpus;
                    
                    // Add contribution at the beginning
                    simulatedCorpus += yearly.getContribution();
                    
                    // Apply monthly returns
                    for (int month = 0; month < 12; month++) {
                        double z = monteCarloEngine.getRandomGenerator().nextGaussian();
                        double monthlyReturn = Math.exp(mu/12 + sigma*Math.sqrt(1.0/12) * z) - 1;
                        simulatedCorpus *= (1 + monthlyReturn);
                    }
                    
                    // Fix the fundamental issue with the end corpus calculation for the first year
                    corpusValues[i] = simulatedCorpus - yearly.getWithdrawal();
                }
                
                // Print statistics about the simulations
                double min = Double.MAX_VALUE;
                double max = Double.MIN_VALUE;
                double sum = 0;
                for (double value : corpusValues) {
                    min = Math.min(min, value);
                    max = Math.max(max, value);
                    sum += value;
                }
                double median = monteCarloEngine.calculatePercentile(corpusValues, 50);
                
                System.out.println("Simulation Results:");
                System.out.println("Min: " + min);
                System.out.println("Max: " + max);
                System.out.println("Avg: " + (sum / corpusValues.length));
                System.out.println("Median (50th percentile): " + median);
                System.out.println("5th percentile: " + monteCarloEngine.calculatePercentile(corpusValues, 5));
                System.out.println("95th percentile: " + monteCarloEngine.calculatePercentile(corpusValues, 95));
                
            } else {
                // For subsequent years, we need to adjust each simulation path
                // to include this year's contribution in the start corpus
                
                // Store the previous year's corpus values as starting point
                double[] startingCorpusValues = new double[numSimulations];
                
                // Add this year's contribution to each simulation path
                for (int i = 0; i < numSimulations; i++) {
                    startingCorpusValues[i] = previousYearEndCorpus[i];
                }
                
                // Run simulations using these values as starting point
                // Pass false for applyContributionUpfront since contribution is already in startCorpus
                corpusValues = monteCarloEngine.simulateCorpusAtAgeFromValues(
                    startingCorpusValues, yearly.getContribution(), yearly.getWithdrawal(),
                    params.getExpectedReturn(), params.getStandardDeviation(), numSimulations
                );
            }
            
            yearly.setCorpusValues(corpusValues);
            previousYearEndCorpus = corpusValues;  // Store for next year
            
            // Calculate percentiles
            yearly.setPercentile5(monteCarloEngine.calculatePercentile(corpusValues, 5));
            yearly.setPercentile95(monteCarloEngine.calculatePercentile(corpusValues, 95));
            
            // Calculate and set the median (50th percentile) as the end corpus
            double medianCorpus = monteCarloEngine.calculatePercentile(corpusValues, 50);
            yearly.setEndCorpus(medianCorpus);
            
            // Calculate depletion risk and success rate
            int depleted = 0;
            for (double value : corpusValues) {
                if (value <= 0) {
                    depleted++;
                }
            }
            
            yearly.setDepletionRisk((double) depleted / numSimulations * 100);
            yearly.setSuccessRate(100 - yearly.getDepletionRisk());
            
            // Update progress tracker
            yearCount++;
            progressTracker.update(yearCount);
        }
        
        System.out.println("\nStochastic projections complete.");
    }
    
    /**
     * Calculate the required corpus for a target success rate.
     * 
     * @param params The retirement parameters
     * @return The required corpus
     */
    public double calculateRequiredCorpus(RetirementParameters params) {
        return monteCarloEngine.calculateRequiredCorpus(params);
    }
    
    /**
     * Calculate the projected corpus at retirement.
     * 
     * @param params The retirement parameters
     * @return The projected corpus at retirement
     */
    public double calculateProjectedCorpus(RetirementParameters params) {
        return monteCarloEngine.calculateProjectedCorpus(params);
    }
    
    /**
     * Find the yearly tracking data for a specific age.
     * 
     * @param trackingData List of YearlyTracking objects
     * @param age The age to find
     * @return The YearlyTracking object for the specified age, or null if not found
     */
    public YearlyTracking findTrackingForAge(List<YearlyTracking> trackingData, int age) {
        for (YearlyTracking yearly : trackingData) {
            if (yearly.getAge() == age) {
                return yearly;
            }
        }
        return null;
    }
}
