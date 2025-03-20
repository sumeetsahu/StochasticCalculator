/**
 * Generates reports and summaries for retirement simulations.
 * This is a JavaScript port of the Java ReportGenerator class.
 */
class ReportGenerator {
    /**
     * Constructor
     */
    constructor() {
        this.monteCarloEngine = new MonteCarloEngine();
    }
    
    /**
     * Generate a report for basic mode calculations
     * 
     * @param {RetirementParameters} params - The retirement parameters
     * @param {number} requiredCorpus - The calculated required corpus
     * @param {number} successRate - The success rate
     * @returns {string} The generated report HTML
     */
    generateBasicModeReport(params, requiredCorpus, successRate) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        });
        
        let report = `
            <div class="report">
                <h5 class="mb-3">Retirement Corpus Required: ${formatter.format(requiredCorpus)}</h5>
                
                <div class="card mb-3">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">Success Rate Analysis</h6>
                    </div>
                    <div class="card-body">
                        <p>With a corpus of ${formatter.format(requiredCorpus)}, your retirement plan has a 
                        <strong>${successRate.toFixed(1)}%</strong> chance of success over the 
                        ${params.retirementPeriod} year retirement period.</p>
                        
                        <p>This means that in ${successRate.toFixed(1)}% of the simulated scenarios, your money 
                        lasted throughout retirement without being depleted.</p>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">Key Parameters</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tbody>
                                <tr>
                                    <th scope="row">Annual Expenses:</th>
                                    <td>${formatter.format(params.annualExpense)}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Retirement Period:</th>
                                    <td>${params.retirementPeriod} years</td>
                                </tr>
                                <tr>
                                    <th scope="row">Expected Return:</th>
                                    <td>${(params.expectedReturn * 100).toFixed(1)}%</td>
                                </tr>
                                <tr>
                                    <th scope="row">Standard Deviation:</th>
                                    <td>${(params.standardDeviation * 100).toFixed(1)}%</td>
                                </tr>
                                <tr>
                                    <th scope="row">Inflation Rate:</th>
                                    <td>${(params.inflation * 100).toFixed(1)}%</td>
                                </tr>
                                <tr>
                                    <th scope="row">Adjust for Inflation:</th>
                                    <td>${params.adjustForInflation ? 'Yes' : 'No'}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Number of Simulations:</th>
                                    <td>${params.numSimulations.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">Withdrawal Rate Analysis</h6>
                    </div>
                    <div class="card-body">
                        <p>Your initial withdrawal rate is 
                        <strong>${((params.annualExpense / requiredCorpus) * 100).toFixed(2)}%</strong> 
                        of your retirement corpus.</p>
                        
                        ${params.adjustForInflation ? 
                            `<p>Since your withdrawals will be adjusted for inflation, the real withdrawal amount will 
                            increase over time, even though the percentage remains the same.</p>` : 
                            `<p>Your withdrawals will not be adjusted for inflation, so the real value of your withdrawals 
                            will decrease over time, even though the dollar amount remains the same.</p>`}
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">Recommendations</h6>
                    </div>
                    <div class="card-body">
                        ${this._generateRecommendations(params, requiredCorpus, successRate)}
                    </div>
                </div>
            </div>
        `;
        
        return report;
    }
    
    /**
     * Generate a report for advanced mode calculations
     * 
     * @param {RetirementParameters} params - The retirement parameters
     * @param {number} projectedCorpus - The projected corpus at retirement
     * @param {number} requiredCorpus - The required corpus for target success rate
     * @param {number} currentSuccessRate - The current success rate
     * @param {Object} scenarios - The generated scenarios
     * @returns {string} The generated report HTML
     */
    generateAdvancedModeReport(params, projectedCorpus, requiredCorpus, currentSuccessRate, scenarios) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        });
        
        // Calculate gap and funding status
        const gap = requiredCorpus - projectedCorpus;
        const fundingStatus = (projectedCorpus / requiredCorpus) * 100;
        
        // Generate status message
        let statusMessage = '';
        if (fundingStatus >= 100) {
            statusMessage = `<span class="text-success">
                <strong>On Track:</strong> Your projected retirement corpus exceeds the required amount for 
                your target success rate.
            </span>`;
        } else if (fundingStatus >= 85) {
            statusMessage = `<span class="text-primary">
                <strong>Nearly There:</strong> You're at ${fundingStatus.toFixed(1)}% of your required 
                retirement corpus. Some minor adjustments should get you on track.
            </span>`;
        } else if (fundingStatus >= 70) {
            statusMessage = `<span class="text-warning">
                <strong>Work Needed:</strong> You're at ${fundingStatus.toFixed(1)}% of your required 
                retirement corpus. Consider implementing some of the scenarios below.
            </span>`;
        } else {
            statusMessage = `<span class="text-danger">
                <strong>Significant Gap:</strong> You're at only ${fundingStatus.toFixed(1)}% of your required 
                retirement corpus. Major changes to your retirement plan are recommended.
            </span>`;
        }
        
        let report = `
            <div class="report">
                <h5 class="mb-3">Retirement Readiness Assessment</h5>
                
                <div class="card mb-3">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">Retirement Funding Status</h6>
                    </div>
                    <div class="card-body">
                        <p>${statusMessage}</p>
                        
                        <table class="table table-sm">
                            <tbody>
                                <tr>
                                    <th scope="row">Projected Corpus at Age ${params.retirementAge}:</th>
                                    <td>${formatter.format(projectedCorpus)}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Required Corpus for ${params.targetSuccessRate}% Success Rate:</th>
                                    <td>${formatter.format(requiredCorpus)}</td>
                                </tr>
                                <tr class="${gap > 0 ? 'table-danger' : 'table-success'}">
                                    <th scope="row">Gap:</th>
                                    <td>${formatter.format(Math.abs(gap))} ${gap > 0 ? 'shortfall' : 'surplus'}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Current Success Rate:</th>
                                    <td>${currentSuccessRate.toFixed(1)}%</td>
                                </tr>
                                <tr>
                                    <th scope="row">Target Success Rate:</th>
                                    <td>${params.targetSuccessRate}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">Key Parameters</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <table class="table table-sm">
                                    <tbody>
                                        <tr>
                                            <th scope="row">Current Age:</th>
                                            <td>${params.currentAge}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Retirement Age:</th>
                                            <td>${params.retirementAge}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Life Expectancy:</th>
                                            <td>${params.lifeExpectancy}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Years to Retirement:</th>
                                            <td>${params.getYearsToRetirement()}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Retirement Duration:</th>
                                            <td>${params.getRetirementYears()} years</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <table class="table table-sm">
                                    <tbody>
                                        <tr>
                                            <th scope="row">Current Corpus:</th>
                                            <td>${formatter.format(params.currentCorpus)}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Annual Contribution:</th>
                                            <td>${formatter.format(params.annualContribution)}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Annual Expenses:</th>
                                            <td>${formatter.format(params.annualExpense)}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Additional Income:</th>
                                            <td>${formatter.format(params.additionalRetirementIncome)}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Investment Return:</th>
                                            <td>${(params.expectedReturn * 100).toFixed(1)}% ± ${(params.standardDeviation * 100).toFixed(1)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">Recommendations</h6>
                    </div>
                    <div class="card-body">
                        ${this._generateAdvancedRecommendations(params, projectedCorpus, requiredCorpus, currentSuccessRate)}
                    </div>
                </div>
            </div>
        `;
        
        return report;
    }
    
    /**
     * Generate recommendations for basic mode
     * 
     * @param {RetirementParameters} params - The retirement parameters
     * @param {number} requiredCorpus - The calculated required corpus
     * @param {number} successRate - The success rate
     * @returns {string} HTML string with recommendations
     * @private
     */
    _generateRecommendations(params, requiredCorpus, successRate) {
        const recommendations = [];
        
        // Withdrawal rate recommendation
        const withdrawalRate = (params.annualExpense / requiredCorpus) * 100;
        if (withdrawalRate > 4) {
            recommendations.push(`
                <p><strong>Consider a more conservative withdrawal rate:</strong> Your current withdrawal rate of 
                ${withdrawalRate.toFixed(2)}% is higher than the commonly cited 4% rule. 
                You might want to plan for a larger corpus or reduce your planned expenses.</p>
            `);
        }
        
        // Success rate recommendation
        if (successRate < 80) {
            recommendations.push(`
                <p><strong>Aim for a higher success rate:</strong> Your current success rate of 
                ${successRate.toFixed(1)}% means there's a significant risk of running out of money. 
                Consider building a larger corpus or reducing expenses.</p>
            `);
        }
        
        // Asset allocation recommendation
        if (params.standardDeviation > 15) {
            recommendations.push(`
                <p><strong>Consider a more conservative asset allocation:</strong> Your current investment 
                strategy has a high standard deviation (${(params.standardDeviation * 100).toFixed(1)}%), 
                indicating significant volatility. A more balanced portfolio might be appropriate for retirement.</p>
            `);
        } else if (params.standardDeviation < 5 && params.expectedReturn < 0.05) {
            recommendations.push(`
                <p><strong>Consider a more aggressive asset allocation:</strong> Your current investment 
                strategy has a low expected return (${(params.expectedReturn * 100).toFixed(1)}%) and 
                low standard deviation (${(params.standardDeviation * 100).toFixed(1)}%). 
                You might benefit from adding some growth assets to your portfolio.</p>
            `);
        }
        
        // Inflation adjustment recommendation
        if (!params.adjustForInflation) {
            recommendations.push(`
                <p><strong>Account for inflation:</strong> Your calculations currently don't adjust for inflation, 
                which means your purchasing power will decrease over time. For more realistic planning, 
                enable inflation adjustment.</p>
            `);
        }
        
        // If no specific recommendations, provide general advice
        if (recommendations.length === 0) {
            recommendations.push(`
                <p><strong>Your retirement plan looks solid:</strong> With a ${successRate.toFixed(1)}% 
                success rate and a ${withdrawalRate.toFixed(2)}% withdrawal rate, your retirement plan is 
                well-positioned. Continue regular reviews and adjust as needed.</p>
            `);
        }
        
        return recommendations.join('');
    }
    
    /**
     * Generate recommendations for advanced mode
     * 
     * @param {RetirementParameters} params - The retirement parameters
     * @param {number} projectedCorpus - The projected corpus at retirement
     * @param {number} requiredCorpus - The required corpus for target success rate
     * @param {number} currentSuccessRate - The current success rate
     * @returns {string} HTML string with recommendations
     * @private
     */
    _generateAdvancedRecommendations(params, projectedCorpus, requiredCorpus, currentSuccessRate) {
        const recommendations = [];
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        });
        
        // Gap analysis
        const gap = requiredCorpus - projectedCorpus;
        const yearsToRetirement = params.getYearsToRetirement();
        
        if (gap > 0) {
            // If there's a shortfall, calculate additional annual contribution needed
            const additionalAnnualContribution = gap / 
                ((Math.pow(1 + params.expectedReturn, yearsToRetirement) - 1) / params.expectedReturn);
            
            recommendations.push(`
                <p><strong>Increase your savings:</strong> To reach your target success rate of 
                ${params.targetSuccessRate}%, you would need to increase your annual contribution by 
                approximately ${formatter.format(additionalAnnualContribution)}. If this isn't feasible, 
                consider a combination of the strategies below.</p>
            `);
        } else {
            recommendations.push(`
                <p><strong>Your retirement plan is on track:</strong> Your projected corpus at retirement 
                exceeds what's needed for your target success rate of ${params.targetSuccessRate}%. 
                You could potentially retire earlier or reduce your savings rate.</p>
            `);
        }
        
        // Retirement age recommendation
        if (gap > 0 && params.retirementAge < 70) {
            const additionalYears = Math.min(5, Math.ceil(gap / (params.annualContribution + params.currentCorpus * params.expectedReturn)));
            
            recommendations.push(`
                <p><strong>Consider delaying retirement:</strong> Working an additional ${additionalYears} 
                ${additionalYears === 1 ? 'year' : 'years'} would significantly improve your retirement readiness 
                by allowing more time for your investments to grow and reducing the retirement period.</p>
            `);
        }
        
        // Expense reduction recommendation
        if (gap > 0) {
            const expenseReductionNeeded = gap * 0.04; // Using 4% rule as approximation
            const percentReduction = (expenseReductionNeeded / params.annualExpense) * 100;
            
            if (percentReduction <= 20) { // Only suggest if the reduction is reasonable
                recommendations.push(`
                    <p><strong>Reduce retirement expenses:</strong> Reducing your planned retirement expenses 
                    by about ${percentReduction.toFixed(0)}% (${formatter.format(expenseReductionNeeded)} annually) 
                    would help close the gap and increase your success rate.</p>
                `);
            }
        }
        
        // Additional income recommendation
        if (params.additionalRetirementIncome < params.annualExpense * 0.3) {
            recommendations.push(`
                <p><strong>Seek additional income sources:</strong> Generating additional retirement income 
                through part-time work, rental income, or maximizing Social Security benefits could significantly 
                improve your retirement security.</p>
            `);
        }
        
        // Investment strategy recommendation
        if (params.standardDeviation > 15 && params.retirementAge - params.currentAge < 10) {
            recommendations.push(`
                <p><strong>Consider a more conservative investment strategy:</strong> With retirement approaching, 
                your current investment strategy may be too volatile. A more balanced portfolio could help protect 
                against sequence-of-returns risk.</p>
            `);
        } else if (params.standardDeviation < 8 && params.expectedReturn < 0.05 && params.getYearsToRetirement() > 15) {
            recommendations.push(`
                <p><strong>Consider a more aggressive investment strategy:</strong> With ${params.getYearsToRetirement()} 
                years until retirement, your current investment strategy may be too conservative. A strategy with more 
                growth assets could improve your projected corpus.</p>
            `);
        }
        
        // Regular review recommendation
        recommendations.push(`
            <p><strong>Regular reviews:</strong> Retirement planning isn't a one-time exercise. Review your plan 
            annually and adjust as needed based on market performance, changes in your financial situation, or 
            shifts in your retirement goals.</p>
        `);
        
        return recommendations.join('');
    }
}
