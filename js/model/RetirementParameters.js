/**
 * Class representing retirement calculation parameters.
 * This is a JavaScript port of the Java RetirementParameters class.
 */
class RetirementParameters {
    /**
     * Constructor for basic mode parameters
     * 
     * @param {number} annualExpense - Annual expenses in retirement
     * @param {number} retirementPeriod - Number of years in retirement
     * @param {number} expectedReturn - Expected annual return (as decimal, e.g. 0.07 for 7%)
     * @param {number} standardDeviation - Annual standard deviation (as decimal, e.g. 0.10 for 10%)
     * @param {number} inflation - Annual inflation rate (as decimal, e.g. 0.03 for 3%)
     * @param {boolean} adjustForInflation - Whether to adjust expenses for inflation
     * @param {number} numSimulations - Number of Monte Carlo simulations to run
     */
    constructor(annualExpense, retirementPeriod, expectedReturn, standardDeviation, 
                inflation, adjustForInflation, numSimulations) {
        
        // Basic mode parameters
        this.annualExpense = annualExpense;
        this.retirementPeriod = retirementPeriod;
        this.expectedReturn = expectedReturn;
        this.standardDeviation = standardDeviation;
        this.inflation = inflation;
        this.adjustForInflation = adjustForInflation;
        this.numSimulations = numSimulations;
        
        // Default values for advanced mode parameters
        this.currentAge = 0;
        this.retirementAge = 0;
        this.lifeExpectancy = 0;
        this.currentCorpus = 0;
        this.annualContribution = 0;
        this.additionalRetirementIncome = 0;
        this.targetSuccessRate = 85;
    }
    
    /**
     * Set advanced mode parameters
     * 
     * @param {number} currentAge - Current age of the individual
     * @param {number} retirementAge - Target retirement age
     * @param {number} lifeExpectancy - Life expectancy
     * @param {number} currentCorpus - Current retirement corpus
     * @param {number} annualContribution - Annual contribution to retirement corpus
     * @param {number} additionalRetirementIncome - Additional income in retirement (e.g., pension)
     * @param {number} targetSuccessRate - Target success rate (percentage)
     */
    setAdvancedParameters(currentAge, retirementAge, lifeExpectancy, currentCorpus,
                         annualContribution, additionalRetirementIncome, targetSuccessRate) {
        this.currentAge = currentAge;
        this.retirementAge = retirementAge;
        this.lifeExpectancy = lifeExpectancy;
        this.currentCorpus = currentCorpus;
        this.annualContribution = annualContribution;
        this.additionalRetirementIncome = additionalRetirementIncome;
        this.targetSuccessRate = targetSuccessRate;
    }
    
    /**
     * Get the number of years until retirement
     * @returns {number} Years to retirement
     */
    getYearsToRetirement() {
        return this.retirementAge - this.currentAge;
    }
    
    /**
     * Get the number of years in retirement
     * @returns {number} Years in retirement
     */
    getRetirementYears() {
        return this.lifeExpectancy - this.retirementAge;
    }
    
    /**
     * Create a RetirementParameters object from basic mode form data
     * 
     * @param {HTMLFormElement} form - The basic mode form element
     * @returns {RetirementParameters} A new RetirementParameters object
     */
    static fromBasicForm(form) {
        const annualExpense = parseFloat(form.querySelector('#annualExpense').value);
        const retirementPeriod = parseInt(form.querySelector('#retirementPeriod').value);
        const expectedReturn = parseFloat(form.querySelector('#expectedReturn').value) / 100;
        const stdDev = parseFloat(form.querySelector('#stdDev').value) / 100;
        const inflation = parseFloat(form.querySelector('#inflation').value) / 100;
        const adjustForInflation = form.querySelector('#adjustForInflation').checked;
        const numSimulations = parseInt(form.querySelector('#numSimulations').value);
        
        return new RetirementParameters(
            annualExpense,
            retirementPeriod,
            expectedReturn,
            stdDev,
            inflation,
            adjustForInflation,
            numSimulations
        );
    }
    
    /**
     * Create a RetirementParameters object from advanced mode form data
     * 
     * @param {HTMLFormElement} form - The advanced mode form element
     * @returns {RetirementParameters} A new RetirementParameters object
     */
    static fromAdvancedForm(form) {
        const annualExpense = parseFloat(form.querySelector('#advAnnualExpense').value);
        const expectedReturn = parseFloat(form.querySelector('#advExpectedReturn').value) / 100;
        const stdDev = parseFloat(form.querySelector('#advStdDev').value) / 100;
        const inflation = parseFloat(form.querySelector('#advInflation').value) / 100;
        const numSimulations = parseInt(form.querySelector('#advNumSimulations').value);
        
        // Create basic parameters
        const params = new RetirementParameters(
            annualExpense,
            0, // Will be calculated from lifespans
            expectedReturn,
            stdDev,
            inflation,
            true, // Always adjust for inflation in advanced mode
            numSimulations
        );
        
        // Add advanced parameters
        const currentAge = parseInt(form.querySelector('#currentAge').value);
        const retirementAge = parseInt(form.querySelector('#retirementAge').value);
        const lifeExpectancy = parseInt(form.querySelector('#lifeExpectancy').value);
        const currentCorpus = parseFloat(form.querySelector('#currentCorpus').value);
        const annualContribution = parseFloat(form.querySelector('#annualContribution').value);
        const additionalIncome = parseFloat(form.querySelector('#additionalIncome').value);
        const targetSuccessRate = parseFloat(form.querySelector('#targetSuccessRate').value);
        
        params.setAdvancedParameters(
            currentAge,
            retirementAge,
            lifeExpectancy,
            currentCorpus,
            annualContribution,
            additionalIncome,
            targetSuccessRate
        );
        
        return params;
    }
}
