package com.retirement.model;

/**
 * Model class to store retirement parameters for calculations.
 */
public class RetirementParameters {
    // Basic mode parameters
    private double annualExpense;
    private int retirementPeriod;
    private double expectedReturn;
    private double standardDeviation;
    private double inflation;
    private boolean adjustForInflation;
    
    // Advanced mode parameters
    private int currentAge;
    private int retirementAge;
    private int lifeExpectancy;
    private double currentCorpus;
    private double annualContribution;
    private double additionalRetirementIncome;
    private double targetSuccessRate;
    
    // Simulation parameters
    private int numSimulations;
    
    // Constructor for basic mode
    public RetirementParameters(double annualExpense, int retirementPeriod, 
                               double expectedReturn, double standardDeviation, 
                               double inflation, boolean adjustForInflation,
                               int numSimulations) {
        this.annualExpense = annualExpense;
        this.retirementPeriod = retirementPeriod;
        this.expectedReturn = expectedReturn;
        this.standardDeviation = standardDeviation;
        this.inflation = inflation;
        this.adjustForInflation = adjustForInflation;
        this.numSimulations = numSimulations;
    }
    
    // Constructor for advanced mode
    public RetirementParameters(int currentAge, int retirementAge, int lifeExpectancy,
                               double currentCorpus, double annualExpense, 
                               double annualContribution, double additionalRetirementIncome,
                               double expectedReturn, double standardDeviation, 
                               double inflation, double targetSuccessRate,
                               int numSimulations) {
        this.currentAge = currentAge;
        this.retirementAge = retirementAge;
        this.lifeExpectancy = lifeExpectancy;
        this.currentCorpus = currentCorpus;
        this.annualExpense = annualExpense;
        this.annualContribution = annualContribution;
        this.additionalRetirementIncome = additionalRetirementIncome;
        this.expectedReturn = expectedReturn;
        this.standardDeviation = standardDeviation;
        this.inflation = inflation;
        this.targetSuccessRate = targetSuccessRate;
        this.numSimulations = numSimulations;
        this.adjustForInflation = true; // Always adjust for inflation in advanced mode
    }
    
    // Getters and setters
    public double getAnnualExpense() {
        return annualExpense;
    }
    
    public void setAnnualExpense(double annualExpense) {
        this.annualExpense = annualExpense;
    }
    
    public int getRetirementPeriod() {
        return retirementPeriod;
    }
    
    public void setRetirementPeriod(int retirementPeriod) {
        this.retirementPeriod = retirementPeriod;
    }
    
    public double getExpectedReturn() {
        return expectedReturn;
    }
    
    public void setExpectedReturn(double expectedReturn) {
        this.expectedReturn = expectedReturn;
    }
    
    public double getStandardDeviation() {
        return standardDeviation;
    }
    
    public void setStandardDeviation(double standardDeviation) {
        this.standardDeviation = standardDeviation;
    }
    
    public double getInflation() {
        return inflation;
    }
    
    public void setInflation(double inflation) {
        this.inflation = inflation;
    }
    
    public boolean isAdjustForInflation() {
        return adjustForInflation;
    }
    
    public void setAdjustForInflation(boolean adjustForInflation) {
        this.adjustForInflation = adjustForInflation;
    }
    
    public int getCurrentAge() {
        return currentAge;
    }
    
    public void setCurrentAge(int currentAge) {
        this.currentAge = currentAge;
    }
    
    public int getRetirementAge() {
        return retirementAge;
    }
    
    public void setRetirementAge(int retirementAge) {
        this.retirementAge = retirementAge;
    }
    
    public int getLifeExpectancy() {
        return lifeExpectancy;
    }
    
    public void setLifeExpectancy(int lifeExpectancy) {
        this.lifeExpectancy = lifeExpectancy;
    }
    
    public double getCurrentCorpus() {
        return currentCorpus;
    }
    
    public void setCurrentCorpus(double currentCorpus) {
        this.currentCorpus = currentCorpus;
    }
    
    public double getAnnualContribution() {
        return annualContribution;
    }
    
    public void setAnnualContribution(double annualContribution) {
        this.annualContribution = annualContribution;
    }
    
    public double getAdditionalRetirementIncome() {
        return additionalRetirementIncome;
    }
    
    public void setAdditionalRetirementIncome(double additionalRetirementIncome) {
        this.additionalRetirementIncome = additionalRetirementIncome;
    }
    
    public double getTargetSuccessRate() {
        return targetSuccessRate;
    }
    
    public void setTargetSuccessRate(double targetSuccessRate) {
        this.targetSuccessRate = targetSuccessRate;
    }
    
    public int getNumSimulations() {
        return numSimulations;
    }
    
    public void setNumSimulations(int numSimulations) {
        this.numSimulations = numSimulations;
    }
    
    /**
     * Calculate the total retirement years from retirement age to life expectancy.
     * @return Total retirement years
     */
    public int getRetirementYears() {
        return lifeExpectancy - retirementAge;
    }
    
    /**
     * Calculate the years until retirement from current age.
     * @return Years until retirement
     */
    public int getYearsToRetirement() {
        return retirementAge - currentAge;
    }
}
