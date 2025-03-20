/**
 * Tracks the corpus over time for various simulation scenarios.
 * This is a JavaScript port of the Java CorpusTracker class.
 */
class CorpusTracker {
    /**
     * Constructor
     */
    constructor() {
        this.monteCarloEngine = new MonteCarloEngine();
    }
    
    /**
     * Generate year-by-year corpus tracking for a retirement plan.
     * 
     * @param {RetirementParameters} params - The retirement parameters
     * @param {number} initialCorpus - The initial corpus
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Array<Object>} Array of yearly tracking objects
     */
    generateYearlyTracking(params, initialCorpus, progressCallback = null) {
        const currentAge = params.currentAge > 0 ? params.currentAge : 
            (params.retirementAge ? params.retirementAge : 65);
        const finalAge = params.currentAge > 0 ? params.lifeExpectancy : 
            (params.retirementAge ? params.retirementAge + params.retirementPeriod : 95);
        const years = finalAge - currentAge;
        const numSimulations = params.numSimulations;
        
        // Array to hold corpus values for each year and each simulation
        const yearlyCorpusValues = Array(years).fill().map(() => Array(numSimulations).fill(0));
        
        // Start with initial corpus for first year
        if (progressCallback) {
            progressCallback(0);
        }
        
        // Simple implementation: run each simulation separately
        for (let sim = 0; sim < numSimulations; sim++) {
            let corpus = initialCorpus;
            
            for (let year = 0; year < years; year++) {
                const age = currentAge + year;
                const isRetired = params.currentAge > 0 ? 
                    age >= params.retirementAge : true;
                
                if (!isRetired) {
                    // Pre-retirement: add annual contribution
                    corpus += params.annualContribution;
                }
                
                for (let month = 0; month < 12; month++) {
                    // Generate random monthly return
                    const monthlyReturn = this.monteCarloEngine.generateRandomReturn(
                        params.expectedReturn, params.standardDeviation);
                    
                    // Apply return to corpus
                    corpus *= (1 + monthlyReturn);
                    
                    // If retired, withdraw monthly expenses
                    if (isRetired) {
                        // Inflation adjustment is based on the number of years since the start of the simulation
                        const inflationFactor = params.adjustForInflation ? 
                            Math.pow(1 + params.inflation, year) : 1.0;
                        const monthlyExpense = ((params.annualExpense * inflationFactor) - 
                            (params.additionalRetirementIncome || 0)) / 12.0;
                        corpus -= Math.max(0, monthlyExpense);
                        
                        if (corpus <= 0) {
                            corpus = 0;
                            break;
                        }
                    }
                }
                
                // Store corpus value for this year and simulation
                yearlyCorpusValues[year][sim] = corpus;
            }
            
            // Update progress
            if (progressCallback && sim % Math.max(1, Math.floor(numSimulations / 100)) === 0) {
                progressCallback(sim / numSimulations);
            }
        }
        
        // Create yearly tracking objects
        const yearlyTracking = [];
        
        for (let year = 0; year < years; year++) {
            const age = currentAge + year;
            const values = yearlyCorpusValues[year];
            
            // Calculate percentiles
            const percentiles = {};
            [1, 5, 10, 25, 50, 75, 90, 95, 99].forEach(p => {
                percentiles[p] = this.monteCarloEngine.calculatePercentile(values, p);
            });
            
            // Calculate depleted count
            const depletedCount = values.filter(v => v <= 0).length;
            const depletionRate = (depletedCount / numSimulations) * 100;
            
            // Calculate inflation-adjusted annual expense
            // Adjust for inflation from current age to the current year
            const inflationFactor = params.adjustForInflation ? 
                Math.pow(1 + params.inflation, year) : 1.0;
            const adjustedAnnualExpense = params.annualExpense * inflationFactor;
            
            // Create tracking object
            yearlyTracking.push({
                year: year,
                age: age,
                percentiles: percentiles,
                depletionRate: depletionRate,
                medianValue: percentiles[50],
                mean: values.reduce((a, b) => a + b, 0) / numSimulations,
                adjustedAnnualExpense: adjustedAnnualExpense,
                netAnnualExpense: Math.max(0, adjustedAnnualExpense - (params.additionalRetirementIncome || 0))
            });
        }
        
        if (progressCallback) {
            progressCallback(1);
        }
        
        return yearlyTracking;
    }
    
    /**
     * Get the yearly tracking data formatted for chart display
     * 
     * @param {Array<Object>} yearlyTracking - The yearly tracking data
     * @returns {Object} Object with data formatted for charts
     */
    getChartData(yearlyTracking) {
        const labels = yearlyTracking.map(tracking => tracking.age);
        const medianValues = yearlyTracking.map(tracking => tracking.medianValue);
        const percentile25Values = yearlyTracking.map(tracking => tracking.percentiles[25]);
        const percentile75Values = yearlyTracking.map(tracking => tracking.percentiles[75]);
        const percentile10Values = yearlyTracking.map(tracking => tracking.percentiles[10]);
        const percentile90Values = yearlyTracking.map(tracking => tracking.percentiles[90]);
        const depletionRates = yearlyTracking.map(tracking => tracking.depletionRate);
        const annualExpenses = yearlyTracking.map(tracking => tracking.adjustedAnnualExpense);
        
        return {
            labels: labels,
            medianValues: medianValues,
            percentile25Values: percentile25Values,
            percentile75Values: percentile75Values,
            percentile10Values: percentile10Values,
            percentile90Values: percentile90Values,
            depletionRates: depletionRates,
            annualExpenses: annualExpenses
        };
    }
}
