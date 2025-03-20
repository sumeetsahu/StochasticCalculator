/**
 * Generates different retirement scenarios to help users explore alternatives.
 * This is a JavaScript port of the Java ScenarioGenerator class.
 */
class ScenarioGenerator {
    /**
     * Constructor
     */
    constructor() {
        this.monteCarloEngine = new MonteCarloEngine();
    }
    
    /**
     * Generate various scenarios to help users explore different alternatives.
     * 
     * @param {RetirementParameters} params - The base retirement parameters
     * @param {number} targetSuccessRate - The target success rate
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Object} A map of scenario names to scenario descriptions
     */
    generateScenarios(params, targetSuccessRate, progressCallback = null) {
        const scenarios = {};
        
        // Basic parameters
        const currentAge = params.currentAge;
        const retirementAge = params.retirementAge;
        const annualExpense = params.annualExpense;
        const currentCorpus = params.currentCorpus;
        const annualContribution = params.annualContribution;
        
        // Progress tracking
        let totalScenarios = 5;  // Adjust based on number of scenarios
        let completedScenarios = 0;
        
        const updateProgress = () => {
            if (progressCallback) {
                completedScenarios++;
                progressCallback(completedScenarios / totalScenarios);
            }
        };
        
        // Scenario 1: Delay retirement
        if (currentAge < retirementAge - 1) {
            const delayParams = this._cloneParams(params);
            delayParams.setAdvancedParameters(
                currentAge,
                retirementAge + 2,  // Delay by 2 years
                params.lifeExpectancy,
                currentCorpus,
                annualContribution,
                params.additionalRetirementIncome,
                targetSuccessRate
            );
            
            const projectedCorpus = this.monteCarloEngine.calculateProjectedCorpus(delayParams);
            const successRate = this.monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, delayParams);
            
            scenarios['Delay Retirement'] = 
                `<strong>Delay retirement by 2 years</strong><br>` +
                `Delaying retirement to age ${retirementAge + 2} increases your success rate ` +
                `to ${successRate.toFixed(1)}% with a projected corpus of $${this._formatCurrency(projectedCorpus)}.<br>` +
                `<em>This gives your investments more time to grow and reduces the retirement period.</em>`;
            
            updateProgress();
        }
        
        // Scenario 2: Increase contributions
        const increasedContribution = annualContribution * 1.2;  // 20% increase
        const increaseParams = this._cloneParams(params);
        increaseParams.setAdvancedParameters(
            currentAge,
            retirementAge,
            params.lifeExpectancy,
            currentCorpus,
            increasedContribution,
            params.additionalRetirementIncome,
            targetSuccessRate
        );
        
        const increaseProjectedCorpus = this.monteCarloEngine.calculateProjectedCorpus(increaseParams);
        const increaseSuccessRate = this.monteCarloEngine.simulateRetirementWithCorpus(
            increaseProjectedCorpus, increaseParams);
        
        scenarios['Increase Contributions'] = 
            `<strong>Increase annual contributions by 20%</strong><br>` +
            `Increasing your annual contribution to $${this._formatCurrency(increasedContribution)} ` +
            `improves your success rate to ${increaseSuccessRate.toFixed(1)}% with a projected corpus ` +
            `of $${this._formatCurrency(increaseProjectedCorpus)}.<br>` +
            `<em>This directly increases your retirement savings, building a larger corpus.</em>`;
        
        updateProgress();
        
        // Scenario 3: Reduce expenses in retirement
        const reducedExpense = annualExpense * 0.9;  // 10% reduction
        const reduceParams = this._cloneParams(params);
        reduceParams.annualExpense = reducedExpense;
        
        const reduceProjectedCorpus = this.monteCarloEngine.calculateProjectedCorpus(reduceParams);
        const reduceSuccessRate = this.monteCarloEngine.simulateRetirementWithCorpus(
            reduceProjectedCorpus, reduceParams);
        
        scenarios['Reduce Expenses'] = 
            `<strong>Reduce retirement expenses by 10%</strong><br>` +
            `Reducing your planned annual expenses to $${this._formatCurrency(reducedExpense)} ` +
            `increases your success rate to ${reduceSuccessRate.toFixed(1)}% with the same projected corpus.<br>` +
            `<em>Lower expenses mean your money lasts longer in retirement.</em>`;
        
        updateProgress();
        
        // Scenario 4: Additional retirement income
        const additionalIncome = params.additionalRetirementIncome + annualExpense * 0.1;  // Add 10% of expenses
        const incomeParams = this._cloneParams(params);
        incomeParams.setAdvancedParameters(
            currentAge,
            retirementAge,
            params.lifeExpectancy,
            currentCorpus,
            annualContribution,
            additionalIncome,
            targetSuccessRate
        );
        
        const incomeProjectedCorpus = this.monteCarloEngine.calculateProjectedCorpus(incomeParams);
        const incomeSuccessRate = this.monteCarloEngine.simulateRetirementWithCorpus(
            incomeProjectedCorpus, incomeParams);
        
        scenarios['Additional Income'] = 
            `<strong>Secure additional retirement income</strong><br>` +
            `Finding an additional $${this._formatCurrency(additionalIncome - params.additionalRetirementIncome)} ` +
            `of annual retirement income improves your success rate to ${incomeSuccessRate.toFixed(1)}%.<br>` +
            `<em>Sources could include part-time work, rental income, or higher social security benefits.</em>`;
        
        updateProgress();
        
        // Scenario 5: Optimize investment strategy (different expected return/risk profile)
        // This assumes a slight improvement in returns through better asset allocation
        const optimizedReturnParams = this._cloneParams(params);
        optimizedReturnParams.expectedReturn = params.expectedReturn + 0.005;  // 0.5% improvement
        optimizedReturnParams.standardDeviation = params.standardDeviation - 0.005;  // 0.5% reduction in volatility
        
        const optimizedProjectedCorpus = this.monteCarloEngine.calculateProjectedCorpus(optimizedReturnParams);
        const optimizedSuccessRate = this.monteCarloEngine.simulateRetirementWithCorpus(
            optimizedProjectedCorpus, optimizedReturnParams);
        
        scenarios['Optimize Investments'] = 
            `<strong>Optimize investment strategy</strong><br>` +
            `Improving your returns by 0.5% and reducing volatility by 0.5% through better asset allocation ` +
            `increases your success rate to ${optimizedSuccessRate.toFixed(1)}% with a projected corpus ` +
            `of $${this._formatCurrency(optimizedProjectedCorpus)}.<br>` +
            `<em>Even small improvements in returns and risk can significantly impact outcomes.</em>`;
        
        updateProgress();
        
        return scenarios;
    }
    
    /**
     * Clone retirement parameters
     * 
     * @param {RetirementParameters} params - The parameters to clone
     * @returns {RetirementParameters} A clone of the parameters
     * @private
     */
    _cloneParams(params) {
        const clone = new RetirementParameters(
            params.annualExpense,
            params.retirementPeriod,
            params.expectedReturn,
            params.standardDeviation,
            params.inflation,
            params.adjustForInflation,
            params.numSimulations
        );
        
        clone.setAdvancedParameters(
            params.currentAge,
            params.retirementAge,
            params.lifeExpectancy,
            params.currentCorpus,
            params.annualContribution,
            params.additionalRetirementIncome,
            params.targetSuccessRate
        );
        
        return clone;
    }
    
    /**
     * Format a number as currency
     * 
     * @param {number} amount - The amount to format
     * @returns {string} Formatted currency string
     * @private
     */
    _formatCurrency(amount) {
        // Format with commas
        return amount.toLocaleString('en-US', {
            maximumFractionDigits: 0
        });
    }
}
