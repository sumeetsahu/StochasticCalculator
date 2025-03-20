package com.retirement.model;

/**
 * Model class to store yearly tracking data for retirement corpus.
 */
public class YearlyTracking {
    private int age;
    private double startCorpus;
    private double contribution;
    private double withdrawal;
    private double expectedExpense; // Expected annual expense (adjusted for inflation)
    private double returns;
    private double endCorpus;
    private double percentile5;
    private double percentile95;
    private double depletionRisk;
    private double successRate;
    private double[] corpusValues; // Array to store corpus values from simulations

    /**
     * Constructor for YearlyTracking
     * @param age The age for this tracking year
     */
    public YearlyTracking(int age) {
        this.age = age;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public double getStartCorpus() {
        return startCorpus;
    }

    public void setStartCorpus(double startCorpus) {
        this.startCorpus = startCorpus;
    }

    public double getContribution() {
        return contribution;
    }

    public void setContribution(double contribution) {
        this.contribution = contribution;
    }

    public double getWithdrawal() {
        return withdrawal;
    }

    public void setWithdrawal(double withdrawal) {
        this.withdrawal = withdrawal;
    }

    public double getExpectedExpense() {
        return expectedExpense;
    }
    
    public void setExpectedExpense(double expectedExpense) {
        this.expectedExpense = expectedExpense;
    }

    public double getReturns() {
        return returns;
    }

    public void setReturns(double returns) {
        this.returns = returns;
    }

    public double getEndCorpus() {
        return endCorpus;
    }

    public void setEndCorpus(double endCorpus) {
        this.endCorpus = endCorpus;
    }

    public double getPercentile5() {
        return percentile5;
    }

    public void setPercentile5(double percentile5) {
        this.percentile5 = percentile5;
    }

    public double getPercentile95() {
        return percentile95;
    }

    public void setPercentile95(double percentile95) {
        this.percentile95 = percentile95;
    }

    public double getDepletionRisk() {
        return depletionRisk;
    }

    public void setDepletionRisk(double depletionRisk) {
        this.depletionRisk = depletionRisk;
    }

    public double getSuccessRate() {
        return successRate;
    }

    public void setSuccessRate(double successRate) {
        this.successRate = successRate;
    }

    public double[] getCorpusValues() {
        return corpusValues;
    }

    public void setCorpusValues(double[] corpusValues) {
        this.corpusValues = corpusValues;
    }
}
