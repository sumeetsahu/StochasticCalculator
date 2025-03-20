package com.retirement.engine;

import com.retirement.model.RetirementParameters;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Class responsible for generating and evaluating different retirement scenarios.
 */
public class ScenarioGenerator {
    private final MonteCarloEngine monteCarloEngine;
    
    public ScenarioGenerator() {
        this.monteCarloEngine = new MonteCarloEngine();
    }
    
    /**
     * Generate different scenarios to improve retirement success rate.
     * 
     * @param params The base retirement parameters
     * @param targetSuccessRate The target success rate
     * @return Map of scenario names and required adjustments
     */
    public Map<String, String> generateScenarios(RetirementParameters params, double targetSuccessRate) {
        Map<String, String> scenarios = new LinkedHashMap<>();
        
        // Calculate projected corpus and success rate with current parameters
        double projectedCorpus = monteCarloEngine.calculateProjectedCorpus(params);
        double currentSuccessRate = monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, params);
        
        // If already meeting target, return with a message
        if (currentSuccessRate >= targetSuccessRate) {
            scenarios.put("CURRENT PLAN", "Your current plan has a " + String.format("%.1f", currentSuccessRate) + 
                          "% success rate, which exceeds your target of " + targetSuccessRate + "%.");
            return scenarios;
        }
        
        // Scenario 1: Contribution
        double additionalContribution = calculateRequiredAdditionalContribution(params, targetSuccessRate);
        double percentIncrease = (additionalContribution / params.getAnnualContribution()) * 100;
        
        scenarios.put("SCENARIO 1 - CONTRIBUTION", 
                     "Required additional contribution: $" + formatMoney(additionalContribution) + 
                     "/year (+" + String.format("%.1f", percentIncrease) + "%)");
        
        // Scenario 2: Retirement Age
        int additionalYears = calculateRequiredRetirementDelay(params, targetSuccessRate);
        double successRateIncrease = calculateSuccessRateIncrease(params, additionalYears, 0, 0);
        
        scenarios.put("SCENARIO 2 - RETIREMENT AGE", 
                     "Delaying retirement by " + additionalYears + " years would increase success rate by " + 
                      String.format("%.1f", successRateIncrease) + "%");
        
        // Scenario 3: Expenses
        double expenseReduction = calculateRequiredExpenseReduction(params, targetSuccessRate);
        double percentReduction = (expenseReduction / params.getAnnualExpense()) * 100;
        
        scenarios.put("SCENARIO 3 - EXPENSES", 
                     "Reducing expenses by $" + formatMoney(expenseReduction) + 
                     "/year (" + String.format("%.2f", percentReduction) + "%) would increase success rate by " + 
                      String.format("%.1f", calculateSuccessRateIncrease(params, 0, 0, expenseReduction)) + "%");
        
        // Balanced Recommendation
        Map<String, Object> balancedApproach = calculateBalancedApproach(params, targetSuccessRate);
        
        scenarios.put("BALANCED RECOMMENDATION", 
                     balancedApproach.get("recommendation").toString());
        
        return scenarios;
    }
    
    /**
     * Calculate the required additional annual contribution to reach the target success rate.
     * 
     * @param params The base retirement parameters
     * @param targetSuccessRate The target success rate
     * @return The required additional annual contribution
     */
    public double calculateRequiredAdditionalContribution(RetirementParameters params, double targetSuccessRate) {
        double currentContribution = params.getAnnualContribution();
        double minIncrease = 0;
        double maxIncrease = currentContribution * 2; // Maximum increase is twice the current contribution
        double increase = currentContribution * 0.2; // Start with 20% increase
        
        for (int i = 0; i < 10; i++) { // Maximum 10 iterations
            // Create a modified parameters object with increased contribution
            RetirementParameters modifiedParams = cloneParameters(params);
            modifiedParams.setAnnualContribution(currentContribution + increase);
            modifiedParams.setTargetSuccessRate(targetSuccessRate); // Set the target success rate
            
            // Calculate projected corpus and success rate
            double projectedCorpus = monteCarloEngine.calculateProjectedCorpus(modifiedParams);
            double successRate = monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, modifiedParams);
            
            if (Math.abs(successRate - targetSuccessRate) < 0.5) { // Within 0.5% of target
                return increase;
            }
            
            if (successRate < targetSuccessRate) {
                minIncrease = increase;
                increase = (increase + maxIncrease) / 2;
            } else {
                maxIncrease = increase;
                increase = (increase + minIncrease) / 2;
            }
        }
        
        // Final check to ensure we reach the target
        RetirementParameters modifiedParams = cloneParameters(params);
        modifiedParams.setAnnualContribution(currentContribution + increase);
        double projectedCorpus = monteCarloEngine.calculateProjectedCorpus(modifiedParams);
        double successRate = monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, modifiedParams);
        
        if (successRate < targetSuccessRate - 1.0) { // Allow 1% margin of error
            // If target still not met, add a safety margin
            double additionalMargin = (targetSuccessRate - successRate) / 100.0;
            increase *= (1.0 + additionalMargin * 3); // Triple the difference as margin
        }
        
        return increase; // Return best estimate after iterations
    }
    
    /**
     * Calculate the required retirement delay to reach the target success rate.
     * 
     * @param params The base retirement parameters
     * @param targetSuccessRate The target success rate
     * @return The required additional years until retirement
     */
    public int calculateRequiredRetirementDelay(RetirementParameters params, double targetSuccessRate) {
        int maxDelay = 10; // Increased max delay to 10 years for higher success rates
        
        for (int delay = 1; delay <= maxDelay; delay++) {
            // Create a modified parameters object with delayed retirement
            RetirementParameters modifiedParams = cloneParameters(params);
            modifiedParams.setRetirementAge(params.getRetirementAge() + delay);
            modifiedParams.setTargetSuccessRate(targetSuccessRate); // Set the target success rate
            
            // Calculate projected corpus and success rate
            double projectedCorpus = monteCarloEngine.calculateProjectedCorpus(modifiedParams);
            double successRate = monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, modifiedParams);
            
            if (successRate >= targetSuccessRate) {
                return delay;
            }
        }
        
        return maxDelay; // Return maximum delay if target not reached
    }
    
    /**
     * Calculate the required expense reduction to reach the target success rate.
     * 
     * @param params The base retirement parameters
     * @param targetSuccessRate The target success rate
     * @return The required expense reduction
     */
    public double calculateRequiredExpenseReduction(RetirementParameters params, double targetSuccessRate) {
        double currentExpense = params.getAnnualExpense();
        double minReduction = 0;
        double maxReduction = currentExpense * 0.4; // Increased max reduction to 40% for higher success rates
        double reduction = currentExpense * 0.1; // Start with 10% reduction
        
        for (int i = 0; i < 10; i++) { // Maximum 10 iterations
            // Create a modified parameters object with reduced expenses
            RetirementParameters modifiedParams = cloneParameters(params);
            modifiedParams.setAnnualExpense(currentExpense - reduction);
            modifiedParams.setTargetSuccessRate(targetSuccessRate); // Set the target success rate
            
            // Calculate projected corpus and success rate
            double projectedCorpus = monteCarloEngine.calculateProjectedCorpus(modifiedParams);
            double successRate = monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, modifiedParams);
            
            if (Math.abs(successRate - targetSuccessRate) < 0.5) { // Within 0.5% of target
                return reduction;
            }
            
            if (successRate < targetSuccessRate) {
                minReduction = reduction;
                reduction = (reduction + maxReduction) / 2;
            } else {
                maxReduction = reduction;
                reduction = (reduction + minReduction) / 2;
            }
        }
        
        // Final check to ensure we reach the target
        RetirementParameters modifiedParams = cloneParameters(params);
        modifiedParams.setAnnualExpense(currentExpense - reduction);
        double projectedCorpus = monteCarloEngine.calculateProjectedCorpus(modifiedParams);
        double successRate = monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, modifiedParams);
        
        if (successRate < targetSuccessRate - 1.0) { // Allow 1% margin of error
            // If target still not met, add a safety margin
            double additionalMargin = (targetSuccessRate - successRate) / 100.0;
            reduction *= (1.0 + additionalMargin * 3); // Triple the difference as margin
            reduction = Math.min(reduction, currentExpense * 0.5); // Cap at 50% of expenses
        }
        
        return reduction; // Return best estimate after iterations
    }
    
    /**
     * Calculate the success rate increase from adjusting parameters.
     * 
     * @param params The base retirement parameters
     * @param retirementDelay Additional years until retirement
     * @param additionalContribution Additional annual contribution
     * @param expenseReduction Annual expense reduction
     * @return The increase in success rate
     */
    public double calculateSuccessRateIncrease(RetirementParameters params, 
                                              int retirementDelay, 
                                              double additionalContribution, 
                                              double expenseReduction) {
        // Calculate base success rate
        double projectedCorpus = monteCarloEngine.calculateProjectedCorpus(params);
        double baseSuccessRate = monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, params);
        
        // Create modified parameters
        RetirementParameters modifiedParams = cloneParameters(params);
        
        if (retirementDelay > 0) {
            modifiedParams.setRetirementAge(params.getRetirementAge() + retirementDelay);
        }
        
        if (additionalContribution > 0) {
            modifiedParams.setAnnualContribution(params.getAnnualContribution() + additionalContribution);
        }
        
        if (expenseReduction > 0) {
            modifiedParams.setAnnualExpense(params.getAnnualExpense() - expenseReduction);
        }
        
        // Calculate new success rate
        double newProjectedCorpus = monteCarloEngine.calculateProjectedCorpus(modifiedParams);
        double newSuccessRate = monteCarloEngine.simulateRetirementWithCorpus(newProjectedCorpus, modifiedParams);
        
        return newSuccessRate - baseSuccessRate;
    }
    
    /**
     * Calculate a balanced approach to reach target success rate.
     * 
     * @param params The base retirement parameters
     * @param targetSuccessRate The target success rate
     * @return Map containing the balanced recommendation and its components
     */
    public Map<String, Object> calculateBalancedApproach(RetirementParameters params, double targetSuccessRate) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        // Calculate required adjustments for each scenario
        double requiredContribution = calculateRequiredAdditionalContribution(params, targetSuccessRate);
        int requiredDelay = calculateRequiredRetirementDelay(params, targetSuccessRate);
        double requiredExpenseReduction = calculateRequiredExpenseReduction(params, targetSuccessRate);
        
        // Calculate a balanced approach (approximately half of each adjustment)
        int balancedDelay = requiredDelay / 2;
        double balancedContribution = requiredContribution / 2;
        double balancedExpenseReduction = requiredExpenseReduction / 2;
        
        // Create modified parameters with balanced approach
        RetirementParameters modifiedParams = cloneParameters(params);
        modifiedParams.setRetirementAge(params.getRetirementAge() + balancedDelay);
        modifiedParams.setAnnualContribution(params.getAnnualContribution() + balancedContribution);
        modifiedParams.setAnnualExpense(params.getAnnualExpense() - balancedExpenseReduction);
        
        // Calculate success rate with balanced approach
        double projectedCorpus = monteCarloEngine.calculateProjectedCorpus(modifiedParams);
        double successRate = monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, modifiedParams);
        
        // If balanced approach doesn't reach target, adjust until it does
        while (successRate < targetSuccessRate) {
            if (balancedDelay < requiredDelay) {
                balancedDelay++;
            } else if (balancedContribution < requiredContribution) {
                balancedContribution += requiredContribution * 0.1;
            } else if (balancedExpenseReduction < requiredExpenseReduction) {
                balancedExpenseReduction += requiredExpenseReduction * 0.1;
            } else {
                break; // Can't improve further
            }
            
            // Update parameters and recalculate
            modifiedParams = cloneParameters(params);
            modifiedParams.setRetirementAge(params.getRetirementAge() + balancedDelay);
            modifiedParams.setAnnualContribution(params.getAnnualContribution() + balancedContribution);
            modifiedParams.setAnnualExpense(params.getAnnualExpense() - balancedExpenseReduction);
            
            projectedCorpus = monteCarloEngine.calculateProjectedCorpus(modifiedParams);
            successRate = monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, modifiedParams);
        }
        
        // Store results
        result.put("delay", balancedDelay);
        result.put("contribution", balancedContribution);
        result.put("expenseReduction", balancedExpenseReduction);
        result.put("successRate", successRate);
        
        // Build recommendation string
        StringBuilder recommendation = new StringBuilder();
        
        if (balancedContribution > 0) {
            recommendation.append("Increase contributions by $").append(formatMoney(balancedContribution)).append("/year");
        }
        
        if (balancedDelay > 0) {
            if (recommendation.length() > 0) {
                recommendation.append(" and ");
            }
            recommendation.append("delay retirement by ").append(balancedDelay).append(" year");
            if (balancedDelay > 1) {
                recommendation.append("s");
            }
        }
        
        if (balancedExpenseReduction > 0) {
            if (recommendation.length() > 0) {
                recommendation.append(" and ");
            }
            recommendation.append("reduce expenses by $").append(formatMoney(balancedExpenseReduction)).append("/year");
        }
        
        result.put("recommendation", recommendation.toString());
        
        return result;
    }
    
    /**
     * Clone retirement parameters.
     * 
     * @param params The retirement parameters to clone
     * @return A copy of the retirement parameters
     */
    private RetirementParameters cloneParameters(RetirementParameters params) {
        return new RetirementParameters(
            params.getCurrentAge(),
            params.getRetirementAge(),
            params.getLifeExpectancy(),
            params.getCurrentCorpus(),
            params.getAnnualExpense(),
            params.getAnnualContribution(),
            params.getAdditionalRetirementIncome(),
            params.getExpectedReturn(),
            params.getStandardDeviation(),
            params.getInflation(),
            params.getTargetSuccessRate(),
            params.getNumSimulations()
        );
    }
    
    /**
     * Format a money value for display.
     * 
     * @param value The money value to format
     * @return Formatted money string
     */
    private String formatMoney(double value) {
        return String.format("%,.0f", value);
    }
}
