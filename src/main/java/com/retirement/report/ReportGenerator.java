package com.retirement.report;

import com.retirement.model.RetirementParameters;
import com.retirement.model.YearlyTracking;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.DecimalFormat;
import java.util.List;
import java.util.Map;

/**
 * Class responsible for formatting and presenting results in reports.
 */
public class ReportGenerator {
    private static final DecimalFormat MONEY_FORMAT = new DecimalFormat("$#,##0.00");
    private static final DecimalFormat PERCENT_FORMAT = new DecimalFormat("0.0%");
    
    /**
     * Generate a summary report for basic mode.
     * 
     * @param params The retirement parameters
     * @param requiredCorpus The calculated required corpus
     * @param successRate The calculated success rate
     * @return A formatted report string
     */
    public String generateBasicModeReport(RetirementParameters params, double requiredCorpus, double successRate) {
        StringBuilder report = new StringBuilder();
        
        report.append("=====================================================\n");
        report.append("          RETIREMENT CORPUS CALCULATOR REPORT        \n");
        report.append("=====================================================\n\n");
        
        report.append("INPUTS:\n");
        report.append(String.format("- Annual Expense: %s\n", formatMoney(params.getAnnualExpense())));
        report.append(String.format("- Retirement Period: %d years\n", params.getRetirementPeriod()));
        report.append(String.format("- Expected Return: %.1f%%\n", params.getExpectedReturn() * 100));
        report.append(String.format("- Standard Deviation: %.1f%%\n", params.getStandardDeviation() * 100));
        report.append(String.format("- Inflation: %.1f%%\n", params.getInflation() * 100));
        report.append(String.format("- Adjust for Inflation: %s\n\n", params.isAdjustForInflation() ? "Yes" : "No"));
        
        report.append("OUTPUTS:\n");
        report.append(String.format("- Required Corpus: %s\n", formatMoney(requiredCorpus)));
        double initialWithdrawalRate = params.getAnnualExpense() / requiredCorpus * 100;
        report.append(String.format("- Initial Withdrawal Rate: %.1f%%\n", initialWithdrawalRate));
        report.append(String.format("- Success Probability: %.1f%%\n\n", successRate));
        
        report.append("WHAT THIS MEANS:\n");
        report.append(String.format("Based on your inputs, you would need approximately %s to fund your retirement. ", 
                                   formatMoney(requiredCorpus)));
        report.append(String.format("This would give you a %.1f%% chance of not running out of money ", successRate));
        report.append(String.format("over your %d-year retirement period.\n\n", params.getRetirementPeriod()));
        
        if (successRate < 80) {
            report.append("NOTE: Your success probability is below 80%. You may want to consider:\n");
            report.append("- Increasing your retirement corpus\n");
            report.append("- Reducing your annual expenses\n");
            report.append("- Adjusting your investment strategy\n");
        }
        
        return report.toString();
    }
    
    /**
     * Generate a summary report for advanced mode.
     * 
     * @param params The retirement parameters
     * @param projectedCorpus The projected corpus at retirement
     * @param requiredCorpus The required corpus for target success rate
     * @param currentSuccessRate The calculated success rate with projected corpus
     * @param scenarios Map of generated scenarios
     * @return A formatted report string
     */
    public String generateAdvancedModeReport(RetirementParameters params, 
                                            double projectedCorpus, 
                                            double requiredCorpus,
                                            double currentSuccessRate,
                                            Map<String, String> scenarios) {
        StringBuilder report = new StringBuilder();
        
        report.append("=====================================================\n");
        report.append("       PERSONALIZED RETIREMENT PLANNING REPORT       \n");
        report.append("=====================================================\n\n");
        
        report.append("INPUTS:\n");
        report.append(String.format("- Current Age: %d\n", params.getCurrentAge()));
        report.append(String.format("- Target Retirement Age: %d\n", params.getRetirementAge()));
        report.append(String.format("- Life Expectancy: %d\n", params.getLifeExpectancy()));
        report.append(String.format("- Current Retirement Corpus: %s\n", formatMoney(params.getCurrentCorpus())));
        report.append(String.format("- Current Annual Expenses: %s\n", formatMoney(params.getAnnualExpense())));
        report.append(String.format("- Annual Contribution: %s\n", formatMoney(params.getAnnualContribution())));
        report.append(String.format("- Additional Retirement Income: %s\n", formatMoney(params.getAdditionalRetirementIncome())));
        report.append(String.format("- Expected Return: %.1f%%\n", params.getExpectedReturn() * 100));
        report.append(String.format("- Standard Deviation: %.1f%%\n", params.getStandardDeviation() * 100));
        report.append(String.format("- Inflation: %.1f%%\n", params.getInflation() * 100));
        report.append(String.format("- Target Success Rate: %.1f%%\n\n", params.getTargetSuccessRate()));
        
        report.append("\nRETIREMENT READINESS:\n");
        report.append(String.format("- Projected Corpus at Retirement: %s\n", formatMoney(projectedCorpus)));
        report.append(String.format("- Required Corpus for Target Success Rate: %s\n", formatMoney(requiredCorpus)));
        
        // Status
        if (projectedCorpus >= requiredCorpus) {
            report.append(String.format("- Current Status: On Track (Surplus of %s)\n", 
                                       formatMoney(projectedCorpus - requiredCorpus)));
        } else {
            report.append(String.format("- Current Status: Shortfall (Shortfall of %s)\n",
                                       formatMoney(requiredCorpus - projectedCorpus)));
        }
        
        report.append(String.format("- Success Probability: %.1f%%\n", currentSuccessRate));
        
        // Add explanation for success probability
        report.append("\nNote: Success Probability represents the likelihood of your retirement corpus lasting\n");
        report.append("      throughout your entire retirement period from your retirement age to life expectancy,\n");
        report.append("      based on the projected corpus at retirement and your planned withdrawal rate.\n");
        
        // Scenarios
        report.append("\nSCENARIO ANALYSIS:\n");
        for (Map.Entry<String, String> entry : scenarios.entrySet()) {
            report.append(entry.getKey().toUpperCase() + ":\n");
            report.append(entry.getValue() + "\n\n");
        }
        
        // Inflation impact
        double inflationFactor = Math.pow(1 + params.getInflation(), 
                                         params.getRetirementAge() - params.getCurrentAge());
        double inflatedExpense = params.getAnnualExpense() * inflationFactor;
        
        report.append("INFLATION IMPACT:\n");
        report.append(String.format("- Current Annual Expense: %s\n", formatMoney(params.getAnnualExpense())));
        report.append(String.format("- Projected Annual Expense at Retirement: %s\n\n", formatMoney(inflatedExpense)));
        
        return report.toString();
    }
    
    /**
     * Generate a report for year-by-year tracking data.
     * 
     * @param params The retirement parameters
     * @param trackingData The tracking data
     * @return The generated report
     */
    public String generateYearByYearReport(RetirementParameters params, List<YearlyTracking> trackingData) {
        StringBuilder report = new StringBuilder();
        
        report.append("=====================================================\n");
        report.append("         YEAR-BY-YEAR RETIREMENT CORPUS TRACKING     \n");
        report.append("=====================================================\n\n");
        
        report.append(String.format("%-5s| %-14s| %-12s| %-12s| %-12s| %-12s| %-14s| %-14s| %-14s| %-7s| %-9s\n", 
                        "Age", "Start Corpus", "Contribution", "Withdrawal", "Expected Exp", "Returns", "End Corpus", 
                        "5th %tile", "95th %tile", "Risk", "Point Succ"));
        report.append("-----|---------------|--------------|--------------|--------------|--------------|---------------|--------------"
                        + "|---------------|--------|----------\n");
        
        for (YearlyTracking yearly : trackingData) {
            // Format numbers
            String startCorpus = formatMoney(yearly.getStartCorpus());
            String contribution = formatMoney(yearly.getContribution());
            String withdrawal = formatMoney(yearly.getWithdrawal());
            String expectedExpense = formatMoney(yearly.getExpectedExpense());
            String returns = formatMoney(yearly.getReturns());
            String endCorpus = formatMoney(yearly.getEndCorpus());
            String percentile5 = formatMoney(yearly.getPercentile5());
            String percentile95 = formatMoney(yearly.getPercentile95());
            
            report.append(String.format("%-5d| %-14s| %-12s| %-12s| %-12s| %-12s| %-14s| %-14s| %-14s| %-6.1f %% | %-6.1f %%\n", 
                            yearly.getAge(), startCorpus, contribution, withdrawal, expectedExpense, returns, endCorpus, 
                            percentile5, percentile95, yearly.getDepletionRisk(), yearly.getSuccessRate()));
            
            // Add warning if depletion risk is high
            if (yearly.getDepletionRisk() > 40) {
                report.append("                    !!! WARNING: HIGH DEPLETION RISK IN THIS PERIOD !!!\n");
            } else if (yearly.getDepletionRisk() > 10) {
                report.append("                    ^ CAUTION: MODERATE DEPLETION RISK IN THIS PERIOD ^\n");
            }
        }
        
        // Add explanatory note about the difference between success metrics
        report.append("\n");
        report.append("NOTE ABOUT SUCCESS METRICS:\n");
        report.append("- 'Point Succ' (Point Success Rate): The probability of having funds remaining AT this specific age,\n");
        report.append("  calculated independently for each year. This does not account for corpus depletion in earlier years.\n");
        report.append("- 'Success Probability' (in the Retirement Readiness section): The probability of your corpus lasting\n");
        report.append("  THROUGHOUT your entire retirement period, from retirement age to life expectancy.\n");
        report.append("  These metrics measure different aspects of retirement success and may differ, especially in later years.\n");
        
        // Generate key insights
        report.append("\nKEY INSIGHTS:\n");
        generateKeyInsights(params, trackingData, report);
        
        return report.toString();
    }
    
    /**
     * Save a report to a file.
     * 
     * @param report The report string to save
     * @param filename The filename to save to
     * @return true if successful, false otherwise
     */
    public boolean saveReportToFile(String report, String filename) {
        try {
            String homeDir = System.getProperty("user.home");
            Path filePath = Paths.get(homeDir, filename);
            
            try (PrintWriter writer = new PrintWriter(new FileWriter(filePath.toString()))) {
                writer.print(report);
                return true;
            }
        } catch (IOException e) {
            System.err.println("Error saving report: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Find the yearly tracking data for a specific age.
     * 
     * @param trackingData List of YearlyTracking objects
     * @param age The age to find
     * @return The YearlyTracking object for the specified age, or null if not found
     */
    private YearlyTracking findTrackingForAge(List<YearlyTracking> trackingData, int age) {
        for (YearlyTracking yearly : trackingData) {
            if (yearly.getAge() == age) {
                return yearly;
            }
        }
        return null;
    }
    
    /**
     * Format a money value for display.
     * 
     * @param value The money value to format
     * @return Formatted money string
     */
    private String formatMoney(double value) {
        if (value >= 1_000_000) {
            return String.format("$%,.2fM", value / 1_000_000);
        } else {
            return String.format("$%,.2f", value);
        }
    }
    
    private void generateKeyInsights(RetirementParameters params, List<YearlyTracking> trackingData, StringBuilder report) {
        // Analysis of retirement readiness
        YearlyTracking retirementYearTracking = findTrackingForAge(trackingData, params.getRetirementAge());
        if (retirementYearTracking != null) {
            report.append(String.format("- At retirement (age %d), your projected corpus is %s with a %.1f%% success rate.\n",
                                       params.getRetirementAge(),
                                       formatMoney(retirementYearTracking.getStartCorpus()),
                                       retirementYearTracking.getSuccessRate()));
        }
        
        // Find the age where depletion risk first exceeds 10%
        int riskAge = -1;
        for (YearlyTracking yearly : trackingData) {
            if (yearly.getDepletionRisk() > 10 && yearly.getAge() >= params.getRetirementAge()) {
                riskAge = yearly.getAge();
                break;
            }
        }
        
        if (riskAge > 0) {
            report.append(String.format("- Depletion risk first exceeds 10%% at age %d.\n", riskAge));
        } else {
            report.append("- Your retirement plan maintains a high success rate throughout your expected lifetime.\n");
        }
        
        // Recommendation based on risk
        YearlyTracking lastYearTracking = trackingData.get(trackingData.size() - 1);
        if (lastYearTracking.getSuccessRate() < 80) {
            report.append("- RECOMMENDATION: Consider adjusting your retirement plan to improve your long-term success rate.\n");
        } else {
            report.append("- Your retirement plan appears sustainable through your expected lifetime.\n");
        }
    }
}
