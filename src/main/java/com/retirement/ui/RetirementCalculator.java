package com.retirement.ui;

import com.retirement.engine.CorpusTracker;
import com.retirement.engine.MonteCarloEngine;
import com.retirement.engine.ScenarioGenerator;
import com.retirement.model.RetirementParameters;
import com.retirement.model.YearlyTracking;
import com.retirement.report.ReportGenerator;

import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.InputMismatchException;
import java.util.List;
import java.util.Map;
import java.util.Scanner;

/**
 * Main class for user interaction and orchestration of retirement calculator.
 */
public class RetirementCalculator {
    private final Scanner scanner;
    private final MonteCarloEngine monteCarloEngine;
    private final CorpusTracker corpusTracker;
    private final ScenarioGenerator scenarioGenerator;
    private final ReportGenerator reportGenerator;
    private final DecimalFormat moneyFormat;
    
    /**
     * Constructor for RetirementCalculator.
     */
    public RetirementCalculator() {
        this.scanner = new Scanner(System.in);
        this.monteCarloEngine = new MonteCarloEngine();
        this.corpusTracker = new CorpusTracker();
        this.scenarioGenerator = new ScenarioGenerator();
        this.reportGenerator = new ReportGenerator();
        this.moneyFormat = new DecimalFormat("$#,##0.00");
    }
    
    /**
     * Start the retirement calculator.
     */
    public void start() {
        boolean running = true;
        
        while (running) {
            displayMenu();
            int choice = getIntInput("Enter your choice: ", 1, 4);
            
            switch (choice) {
                case 1:
                    runBasicMode();
                    break;
                case 2:
                    runAdvancedMode();
                    break;
                case 3:
                    displayHelp();
                    break;
                case 4:
                    running = false;
                    break;
            }
        }
        
        System.out.println("Thank you for using the Retirement Corpus Stochastic Calculator!");
        scanner.close();
    }
    
    /**
     * Display the main menu.
     */
    private void displayMenu() {
        System.out.println("\n====================================================");
        System.out.println("      RETIREMENT CORPUS STOCHASTIC CALCULATOR       ");
        System.out.println("====================================================");
        System.out.println("1. Basic Mode - Corpus Calculation");
        System.out.println("2. Advanced Mode - Personalized Planning");
        System.out.println("3. Help and Information");
        System.out.println("4. Exit");
        System.out.println("====================================================");
    }
    
    /**
     * Run the basic mode - corpus calculation.
     */
    private void runBasicMode() {
        System.out.println("\n--- BASIC MODE: CORPUS CALCULATION ---");
        
        // Collect inputs with defaults
        System.out.println("\nPlease enter the following information (or press Enter for default):");
        
        double annualExpense = getDoubleInputWithDefault("Annual expenses: ($) ", 60000);
        int retirementPeriod = getIntInputWithDefault("Retirement period (years): ", 30);
        double expectedReturn = getDoubleInputWithDefault("Expected annual return (%): ", 7) / 100.0;
        double stdDev = getDoubleInputWithDefault("Annual standard deviation (%): ", 10) / 100.0;
        double inflation = getDoubleInputWithDefault("Annual inflation rate (%): ", 3) / 100.0;
        boolean adjustForInflation = getBooleanInput("Adjust for inflation? (y/n): ", true);
        int numSimulations = getIntInputWithDefault("Number of simulations (1000-10000): ", 5000);
        
        // Create parameters object
        RetirementParameters params = new RetirementParameters(
            annualExpense, retirementPeriod, expectedReturn, stdDev, inflation, adjustForInflation, numSimulations
        );
        
        // Calculate required corpus and success rate
        System.out.println("\nCalculating required corpus...");
        double requiredCorpus = monteCarloEngine.calculateRequiredCorpus(params);
        double successRate = monteCarloEngine.simulateRetirementWithCorpus(requiredCorpus, params);
        
        // Generate and display report
        String report = reportGenerator.generateBasicModeReport(params, requiredCorpus, successRate);
        System.out.println(report);
        
        // Offer to save report
        if (getBooleanInput("Would you like to save this report to a file? (y/n): ", false)) {
            String filename = "RetirementReport_Basic_" + 
                             LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + 
                             ".txt";
            boolean saved = reportGenerator.saveReportToFile(report, filename);
            
            if (saved) {
                System.out.println("Report saved to " + filename + " in your home directory.");
            } else {
                System.out.println("Error saving report.");
            }
        }
    }
    
    /**
     * Run the advanced mode - personalized planning.
     */
    private void runAdvancedMode() {
        System.out.println("\n--- ADVANCED MODE: PERSONALIZED PLANNING ---");
        
        // Collect inputs with defaults
        System.out.println("\nPlease enter the following information (or press Enter for default):");
        
        int currentAge = getIntInputWithDefault("Current age: ", 40);
        int retirementAge = getIntInputWithDefault("Target retirement age: ", 65);
        int lifeExpectancy = getIntInputWithDefault("Life expectancy: ", 90);
        double currentCorpus = getDoubleInputWithDefault("Current retirement corpus: ($) ", 500000);
        double annualExpense = getDoubleInputWithDefault("Annual expenses: ($) ", 80000);
        double annualContribution = getDoubleInputWithDefault("Annual contribution: ($) ", 30000);
        double additionalIncome = getDoubleInputWithDefault("Additional retirement income (e.g., pension, Social Security): ($) ", 20000);
        double expectedReturn = getDoubleInputWithDefault("Expected annual return (%): ", 7) / 100.0;
        double stdDev = getDoubleInputWithDefault("Annual standard deviation (%): ", 10) / 100.0;
        double inflation = getDoubleInputWithDefault("Annual inflation rate (%): ", 3) / 100.0;
        double targetSuccessRate = getDoubleInputWithDefault("Target success rate (%): ", 85);
        int numSimulations = getIntInputWithDefault("Number of simulations (1000-10000): ", 5000);
        
        // Create parameters object
        RetirementParameters params = new RetirementParameters(
            currentAge, retirementAge, lifeExpectancy, currentCorpus, 
            annualExpense, annualContribution, additionalIncome,
            expectedReturn, stdDev, inflation, targetSuccessRate, numSimulations
        );
        
        // Calculate projected corpus and success rate
        System.out.println("\nCalculating retirement projections...");
        double projectedCorpus = monteCarloEngine.calculateProjectedCorpus(params);
        double currentSuccessRate = monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, params);
        
        // Calculate required corpus for target success rate
        double requiredCorpus = 0;
        if (currentSuccessRate < targetSuccessRate) {
            RetirementParameters tempParams = new RetirementParameters(
                annualExpense, params.getRetirementYears(), expectedReturn, 
                stdDev, inflation, true, numSimulations
            );
            
            // Set the target success rate in the temp params
            tempParams.setTargetSuccessRate(targetSuccessRate);
            
            requiredCorpus = monteCarloEngine.calculateRequiredCorpus(tempParams);
            
            // Validate the calculated corpus meets the target success rate
            double validationSuccessRate = monteCarloEngine.simulateRetirementWithCorpus(requiredCorpus, tempParams);
            
            if (validationSuccessRate < targetSuccessRate - 1.0) { // Allow 1% margin of error
                // If target still not met, add a safety margin
                double additionalMargin = (targetSuccessRate - validationSuccessRate) / 100.0;
                requiredCorpus *= (1.0 + additionalMargin * 3); // Triple the difference as margin
            }
        } else {
            requiredCorpus = projectedCorpus * 0.9; // If already exceeding target, set required to 90% of projected
        }
        
        // Generate scenarios
        Map<String, String> scenarios = scenarioGenerator.generateScenarios(params, targetSuccessRate);
        
        // Generate report
        String summaryReport = reportGenerator.generateAdvancedModeReport(
            params, projectedCorpus, requiredCorpus, currentSuccessRate, scenarios
        );
        System.out.println(summaryReport);
        
        // If the current success rate is below target, offer scenarios
        if (currentSuccessRate < targetSuccessRate) {
            // Ask the user to select a scenario
            System.out.println("\nWould you like to adopt one of the recommended scenarios?");
            System.out.println("1. Contribution Scenario - Increase annual contribution");
            System.out.println("2. Retirement Age Scenario - Delay retirement");
            System.out.println("3. Expenses Scenario - Reduce annual expenses");
            System.out.println("4. Balanced Approach - Combined adjustments");
            System.out.println("5. No changes - Keep current plan");
            
            int scenarioChoice = getIntInput("Enter your choice: ", 1, 5);
            
            // Create a new parameters object with the selected scenario's adjustments
            RetirementParameters updatedParams = new RetirementParameters(
                currentAge, retirementAge, lifeExpectancy, currentCorpus, 
                annualExpense, annualContribution, additionalIncome,
                expectedReturn, stdDev, inflation, targetSuccessRate, numSimulations
            );
            
            // Apply the selected scenario
            switch (scenarioChoice) {
                case 1: // Contribution Scenario
                    double additionalContribution = scenarioGenerator.calculateRequiredAdditionalContribution(params, targetSuccessRate);
                    updatedParams.setAnnualContribution(annualContribution + additionalContribution);
                    System.out.println("\nIncreasing annual contribution to " + 
                                     moneyFormat.format(annualContribution + additionalContribution));
                    break;
                case 2: // Retirement Age Scenario
                    int additionalYears = scenarioGenerator.calculateRequiredRetirementDelay(params, targetSuccessRate);
                    updatedParams.setRetirementAge(retirementAge + additionalYears);
                    System.out.println("\nDelaying retirement to age " + (retirementAge + additionalYears));
                    break;
                case 3: // Expenses Scenario
                    double expenseReduction = scenarioGenerator.calculateRequiredExpenseReduction(params, targetSuccessRate);
                    updatedParams.setAnnualExpense(annualExpense - expenseReduction);
                    System.out.println("\nReducing annual expenses to " + 
                                     moneyFormat.format(annualExpense - expenseReduction));
                    break;
                case 4: // Balanced Approach
                    Map<String, Object> balancedApproach = scenarioGenerator.calculateBalancedApproach(params, targetSuccessRate);
                    double balancedContribution = (double) balancedApproach.get("contribution");
                    int balancedDelay = (int) balancedApproach.get("delay");
                    double balancedExpenseReduction = (double) balancedApproach.get("expenseReduction");
                    
                    updatedParams.setAnnualContribution(annualContribution + balancedContribution);
                    updatedParams.setRetirementAge(retirementAge + balancedDelay);
                    updatedParams.setAnnualExpense(annualExpense - balancedExpenseReduction);
                    
                    System.out.println("\nApplying balanced approach:");
                    if (balancedContribution > 0) {
                        System.out.println("- Increasing annual contribution to " + 
                                         moneyFormat.format(annualContribution + balancedContribution));
                    }
                    if (balancedDelay > 0) {
                        System.out.println("- Delaying retirement to age " + (retirementAge + balancedDelay));
                    }
                    if (balancedExpenseReduction > 0) {
                        System.out.println("- Reducing annual expenses to " + 
                                         moneyFormat.format(annualExpense - balancedExpenseReduction));
                    }
                    break;
                case 5: // No changes
                    System.out.println("\nKeeping current plan without changes.");
                    updatedParams = params; // No changes needed
                    break;
            }
            
            // Rerun the simulation with the updated parameters if the user selected a scenario
            if (scenarioChoice < 5) {
                System.out.println("\nRecalculating retirement projections with the selected scenario...");
                
                // Recalculate projected corpus and success rate
                double updatedProjectedCorpus = monteCarloEngine.calculateProjectedCorpus(updatedParams);
                double updatedSuccessRate = monteCarloEngine.simulateRetirementWithCorpus(updatedProjectedCorpus, updatedParams);
                
                // Generate updated report
                System.out.println("\nUPDATED RETIREMENT READINESS:");
                System.out.println(String.format("- Projected Corpus at Retirement: %s", formatMoney(updatedProjectedCorpus)));
                System.out.println(String.format("- Success Probability: %.1f%%", updatedSuccessRate));
                System.out.println(String.format("- Previous Success Probability: %.1f%%", currentSuccessRate));
                System.out.println(String.format("- Improvement: %.1f%%", updatedSuccessRate - currentSuccessRate));
                
                // Update params for tracking
                params = updatedParams;
                
                // Add updated information to summary report
                summaryReport += "\n\nUPDATED RETIREMENT READINESS:\n";
                summaryReport += String.format("- Projected Corpus at Retirement: %s\n", formatMoney(updatedProjectedCorpus));
                summaryReport += String.format("- Success Probability: %.1f%%\n", updatedSuccessRate);
                summaryReport += String.format("- Previous Success Probability: %.1f%%\n", currentSuccessRate);
                summaryReport += String.format("- Improvement: %.1f%%\n", updatedSuccessRate - currentSuccessRate);
            }
        }
        
        // Ask if user wants to see year-by-year tracking
        if (getBooleanInput("\nWould you like to see year-by-year corpus tracking? (y/n): ", true)) {
            System.out.println("\nGenerating year-by-year tracking...");
            List<YearlyTracking> trackingData = corpusTracker.generateYearByYearTracking(params);
            String trackingReport = reportGenerator.generateYearByYearReport(params, trackingData);
            System.out.println(trackingReport);
            
            // Combine reports
            summaryReport += "\n" + trackingReport;
        }
        
        // Offer to save report
        if (getBooleanInput("Would you like to save this report to a file? (y/n): ", false)) {
            String filename = "RetirementReport_Advanced_" + 
                             LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + 
                             ".txt";
            boolean saved = reportGenerator.saveReportToFile(summaryReport, filename);
            
            if (saved) {
                System.out.println("Report saved to " + filename + " in your home directory.");
            } else {
                System.out.println("Error saving report.");
            }
        }
    }
    
    /**
     * Display help and information.
     */
    private void displayHelp() {
        System.out.println("\n--- HELP AND INFORMATION ---");
        System.out.println("\nThe Retirement Corpus Stochastic Calculator helps you plan for retirement by simulating");
        System.out.println("thousands of possible market scenarios to determine the likelihood of your retirement plan succeeding.");
        
        System.out.println("\n--- BASIC MODE ---");
        System.out.println("Use Basic Mode when you want to calculate how much money you need to save for retirement.");
        System.out.println("You'll input your expected annual expenses in retirement, how long your retirement will last,");
        System.out.println("and investment parameters. The calculator will tell you the corpus (lump sum) required at");
        System.out.println("the start of retirement.");
        
        System.out.println("\n--- ADVANCED MODE ---");
        System.out.println("Use Advanced Mode when you want to evaluate if your current retirement savings plan is on track.");
        System.out.println("You'll input details about your current age, savings, contributions, and retirement plans.");
        System.out.println("The calculator will project your retirement corpus and evaluate different scenarios to improve");
        System.out.println("your retirement readiness.");
        
        System.out.println("\n--- KEY TERMS ---");
        System.out.println("- Corpus: The total amount of money saved for retirement");
        System.out.println("- Success Rate: The percentage of simulated scenarios where your money lasts throughout retirement");
        System.out.println("- Expected Return: The average annual return you expect from your investments");
        System.out.println("- Standard Deviation: A measure of the volatility or risk of your investments");
        
        System.out.println("\nPress Enter to return to the main menu...");
        scanner.nextLine();
    }
    
    /**
     * Get integer input from user.
     * 
     * @param prompt The prompt to display
     * @param min The minimum allowed value
     * @param max The maximum allowed value
     * @return The validated integer input
     */
    private int getIntInput(String prompt, int min, int max) {
        int input = 0;
        boolean valid = false;
        
        while (!valid) {
            System.out.print(prompt);
            
            try {
                input = scanner.nextInt();
                scanner.nextLine(); // Consume newline
                
                if (input >= min && input <= max) {
                    valid = true;
                } else {
                    System.out.printf("Please enter a number between %d and %d.\n", min, max);
                }
            } catch (InputMismatchException e) {
                System.out.println("Please enter a valid number.");
                scanner.nextLine(); // Consume invalid input
            }
        }
        
        return input;
    }
    
    /**
     * Get integer input from user with default value.
     * 
     * @param prompt The prompt to display
     * @param defaultValue The default value to use if user presses Enter
     * @return The validated integer input or default value
     */
    private int getIntInputWithDefault(String prompt, int defaultValue) {
        System.out.printf("%s [%d]: ", prompt, defaultValue);
        String input = scanner.nextLine().trim();
        
        if (input.isEmpty()) {
            return defaultValue;
        }
        
        try {
            return Integer.parseInt(input);
        } catch (NumberFormatException e) {
            System.out.printf("Invalid input, using default value: %d\n", defaultValue);
            return defaultValue;
        }
    }
    
    /**
     * Get double input from user with default value.
     * 
     * @param prompt The prompt to display
     * @param defaultValue The default value to use if user presses Enter
     * @return The validated double input or default value
     */
    private double getDoubleInputWithDefault(String prompt, double defaultValue) {
        System.out.printf("%s [%s]: ", prompt, defaultValue == (int)defaultValue ? 
                         String.format("%d", (int)defaultValue) : String.format("%.2f", defaultValue));
        String input = scanner.nextLine().trim();
        
        if (input.isEmpty()) {
            return defaultValue;
        }
        
        try {
            return Double.parseDouble(input);
        } catch (NumberFormatException e) {
            System.out.printf("Invalid input, using default value: %.2f\n", defaultValue);
            return defaultValue;
        }
    }
    
    /**
     * Get boolean input from user.
     * 
     * @param prompt The prompt to display
     * @param defaultValue The default value to use if user presses Enter
     * @return The validated boolean input
     */
    private boolean getBooleanInput(String prompt, boolean defaultValue) {
        System.out.printf("%s [%s]: ", prompt, defaultValue ? "y" : "n");
        String input = scanner.nextLine().trim().toLowerCase();
        
        if (input.isEmpty()) {
            return defaultValue;
        }
        
        return input.startsWith("y");
    }
    
    private String formatMoney(double amount) {
        return moneyFormat.format(amount);
    }
}
