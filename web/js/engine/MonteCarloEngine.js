/**
 * Core simulation engine that implements Monte Carlo simulations
 * to model uncertainty in investment returns.
 * This is a JavaScript port of the Java MonteCarloEngine class.
 */
class MonteCarloEngine {
    /**
     * Constructor
     */
    constructor() {
        // Use MersenneTwister for high-quality random number generation
        this.randomGenerator = new MersenneTwister();
        
        // Bind methods that will be used in callbacks
        this.generateRandomReturn = this.generateRandomReturn.bind(this);
        this.simulateRetirementWithCorpus = this.simulateRetirementWithCorpus.bind(this);
        this.calculateRequiredCorpus = this.calculateRequiredCorpus.bind(this);
    }
    
    /**
     * Generate a random monthly return based on expected return and standard deviation.
     * Uses a lognormal distribution to model investment returns.
     * 
     * @param {number} expectedReturn - The annual expected return (e.g., 0.07 for 7%)
     * @param {number} stdDev - The annual standard deviation (e.g., 0.10 for 10%)
     * @returns {number} A random monthly return
     */
    generateRandomReturn(expectedReturn, stdDev) {
        // Convert annual parameters to monthly
        const monthlyExpectedReturn = Math.pow(1 + expectedReturn, 1.0/12.0) - 1;
        const monthlyStdDev = stdDev / Math.sqrt(12);
        
        // Calculate parameters for lognormal distribution
        const mu = Math.log(1 + monthlyExpectedReturn) - 0.5 * Math.pow(monthlyStdDev, 2);
        const sigma = Math.sqrt(Math.log(1 + Math.pow(monthlyStdDev, 2) / 
                                Math.pow(1 + monthlyExpectedReturn, 2)));
        
        // Generate random normal variable
        const z = this.randomGaussian();
        
        // Convert to lognormal and return
        return Math.exp(mu + sigma * z) - 1;
    }
    
    /**
     * Generate a random number from standard normal distribution
     * 
     * @returns {number} Random number from N(0,1)
     */
    randomGaussian() {
        // Box-Muller transform
        const u1 = this.randomGenerator.random();
        const u2 = this.randomGenerator.random();
        
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z;
    }
    
    /**
     * Calculate the projected corpus at retirement.
     * 
     * @param {RetirementParameters} params - The retirement parameters
     * @returns {number} The projected corpus at retirement
     */
    calculateProjectedCorpus(params) {
        const currentCorpus = params.currentCorpus;
        const yearsToRetirement = params.getYearsToRetirement();
        const annualContribution = params.annualContribution;
        const expectedReturn = params.expectedReturn;
        
        // Project current corpus to retirement age
        let projectedCorpus = currentCorpus * Math.pow(1 + expectedReturn, yearsToRetirement);
        
        // Add contributions (assume made at the beginning of each year)
        for (let year = 1; year <= yearsToRetirement; year++) {
            projectedCorpus += annualContribution * Math.pow(1 + expectedReturn, yearsToRetirement - year);
        }
        
        return projectedCorpus;
    }
    
    /**
     * Calculate the required corpus needed for a given success rate.
     * 
     * @param {RetirementParameters} params - The retirement parameters
     * @param {Function} progressCallback - Optional callback for simulation progress
     * @returns {number} The required corpus
     */
    calculateRequiredCorpus(params, progressCallback = null) {
        // Start with an initial estimate based on the "4% rule"
        const annualExpense = params.annualExpense;
        const initialWithdrawalRate = 0.04; // 4% rule as a starting point
        let corpus = annualExpense / initialWithdrawalRate;
        
        // Binary search to find required corpus
        let lowerBound = corpus * 0.5;
        let upperBound = corpus * 3.0; // Increased upper bound for higher success rates
        const targetSuccessRate = params.targetSuccessRate > 0 ? 
                                  params.targetSuccessRate / 100.0 : 0.85; // Get target from params or use 85% default
        let currentSuccessRate;
        
        // Maximum iterations for binary search
        const maxIterations = 15;
        
        for (let i = 0; i < maxIterations; i++) {
            // Update progress if callback provided
            if (progressCallback) {
                progressCallback(i / maxIterations);
            }
            
            currentSuccessRate = this.simulateRetirementWithCorpus(corpus, params) / 100.0;
            
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
        currentSuccessRate = this.simulateRetirementWithCorpus(corpus, params) / 100.0;
        if (currentSuccessRate < targetSuccessRate) {
            // If we're still below target, add a safety margin
            corpus *= (1.0 + (targetSuccessRate - currentSuccessRate) * 2);
        }
        
        // Final progress update
        if (progressCallback) {
            progressCallback(1.0);
        }
        
        return corpus;
    }
    
    /**
     * Run a retirement simulation with a specific corpus.
     * 
     * @param {number} initialCorpus - The starting corpus
     * @param {RetirementParameters} params - The retirement parameters
     * @param {Function} progressCallback - Optional callback for simulation progress
     * @returns {number} The success rate as a percentage (0-100)
     */
    simulateRetirementWithCorpus(initialCorpus, params, progressCallback = null) {
        const numSimulations = params.numSimulations;
        let retirementYears;
        
        // Determine retirement years based on mode
        if (params.currentAge === 0) {
            retirementYears = params.retirementPeriod;
        } else {
            retirementYears = params.getRetirementYears();
        }
        
        const retirementMonths = retirementYears * 12;
        const expectedReturn = params.expectedReturn;
        const stdDev = params.standardDeviation;
        const inflation = params.inflation;
        const annualExpense = params.annualExpense;
        const additionalIncome = params.additionalRetirementIncome || 0;
        const adjustForInflation = params.adjustForInflation;
        
        let successCount = 0;
        
        for (let sim = 0; sim < numSimulations; sim++) {
            let corpus = initialCorpus;
            let depleted = false;
            
            for (let month = 1; month <= retirementMonths; month++) {
                const year = Math.floor((month - 1) / 12);
                
                // Apply inflation adjustment if needed
                const inflationFactor = adjustForInflation ? Math.pow(1 + inflation, year) : 1.0;
                const monthlyExpense = ((annualExpense * inflationFactor) - additionalIncome) / 12.0;
                const actualMonthlyExpense = Math.max(0, monthlyExpense);
                
                // Generate random monthly return
                const monthlyReturn = this.generateRandomReturn(expectedReturn, stdDev);
                
                // Update corpus
                corpus = corpus * (1 + monthlyReturn) - actualMonthlyExpense;
                
                if (corpus <= 0) {
                    depleted = true;
                    break;
                }
            }
            
            if (!depleted) {
                successCount++;
            }
            
            // Update progress if callback provided
            if (progressCallback && sim % Math.max(1, Math.floor(numSimulations / 100)) === 0) {
                progressCallback(sim / numSimulations);
            }
        }
        
        // Final progress update
        if (progressCallback) {
            progressCallback(1.0);
        }
        
        return (successCount / numSimulations) * 100.0;
    }
    
    /**
     * Run a simulation and return the final corpus values for all simulations.
     * 
     * @param {number} initialCorpus - The starting corpus
     * @param {RetirementParameters} params - The retirement parameters
     * @param {Function} progressCallback - Optional callback for simulation progress
     * @returns {Array<number>} Array of final corpus values for each simulation
     */
    simulateRetirementAndReturnCorpusValues(initialCorpus, params, progressCallback = null) {
        const numSimulations = params.numSimulations;
        let retirementYears;
        
        // Determine retirement years based on mode
        if (params.currentAge === 0) {
            retirementYears = params.retirementPeriod;
        } else {
            retirementYears = params.getRetirementYears();
        }
        
        const retirementMonths = retirementYears * 12;
        const expectedReturn = params.expectedReturn;
        const stdDev = params.standardDeviation;
        const inflation = params.inflation;
        const annualExpense = params.annualExpense;
        const additionalIncome = params.additionalRetirementIncome || 0;
        const adjustForInflation = params.adjustForInflation;
        
        const finalCorpusValues = new Array(numSimulations);
        
        for (let sim = 0; sim < numSimulations; sim++) {
            let corpus = initialCorpus;
            
            for (let month = 1; month <= retirementMonths; month++) {
                const year = Math.floor((month - 1) / 12);
                
                // Apply inflation adjustment if needed
                const inflationFactor = adjustForInflation ? Math.pow(1 + inflation, year) : 1.0;
                const monthlyExpense = ((annualExpense * inflationFactor) - additionalIncome) / 12.0;
                const actualMonthlyExpense = Math.max(0, monthlyExpense);
                
                // Generate random monthly return
                const monthlyReturn = this.generateRandomReturn(expectedReturn, stdDev);
                
                // Update corpus
                corpus = corpus * (1 + monthlyReturn) - actualMonthlyExpense;
                
                if (corpus <= 0) {
                    corpus = 0;
                    break;
                }
            }
            
            finalCorpusValues[sim] = corpus;
            
            // Update progress if callback provided
            if (progressCallback && sim % Math.max(1, Math.floor(numSimulations / 100)) === 0) {
                progressCallback(sim / numSimulations);
            }
        }
        
        // Final progress update
        if (progressCallback) {
            progressCallback(1.0);
        }
        
        return finalCorpusValues;
    }
    
    /**
     * Calculate percentiles from an array of corpus values.
     * Uses linear interpolation for more accurate percentile calculation.
     * 
     * @param {Array<number>} corpusValues - Array of corpus values
     * @param {number} percentile - The percentile to calculate (0-100)
     * @returns {number} The value at the specified percentile
     */
    calculatePercentile(corpusValues, percentile) {
        if (corpusValues.length === 0) {
            return 0;
        }
        
        // Sort the values
        const sorted = [...corpusValues].sort((a, b) => a - b);
        
        // Calculate the index
        const index = (percentile / 100) * (sorted.length - 1);
        
        // If index is an integer, return the value at that index
        if (Math.floor(index) === index) {
            return sorted[index];
        }
        
        // Otherwise, interpolate between the surrounding values
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);
        const weight = index - lowerIndex;
        
        return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
    }
}
